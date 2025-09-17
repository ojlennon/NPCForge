import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { v4 as uuidv4 } from 'uuid';
import https from 'https';

const transcribeClient = new TranscribeClient({ region: "us-east-1" });
const dynamoClient = new DynamoDBClient({ region: "us-east-1" });
const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to fetch content from a URL
const fetchUrl = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

// Nova Micro integration to summarize text - simple version
const summarizeWithNovaMicro = async (text) => {
  try {
    console.log('Sending request to Nova Micro for summarization...');
    
    const command = new InvokeModelCommand({
      modelId: 'amazon.nova-micro-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: [
              { text: `summarize the key points in this text: ${text}`}, 
            ],
          },
        ],
      })
    });
    
    const response = await bedrockClient.send(command);
    console.log('response!!')
    console.log(response)
    const responseBody = new TextDecoder().decode(response.body);
    console.log(responseBody)
    const parsedResponse = JSON.parse(responseBody);
    
    return parsedResponse.output.message.content[0].text|| "No summary generated";
  } catch (error) {
    console.error('Error using Nova Micro:', error);
    throw error;
  }
};

export const processTranscription = async (event) => {
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));
        
        // Parse the event body if it's coming from API Gateway
        const requestData = typeof event.body === 'string'
            ? JSON.parse(event.body)
            : event;
        
        const { audioFile, playerID, NPCID, GameID, Timestamp } = requestData;
        
        // Validate required fields
        const requiredFields = ['audioFile', 'playerID', 'NPCID', 'GameID', 'Timestamp'];
        const missingFields = requiredFields.filter(field => !requestData[field]);
        if (missingFields.length > 0) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    success: false,
                    error: `Missing required fields: ${missingFields.join(', ')}`
                })
            };
        }
        
        // Check that the audio file format is properly specified
        let mediaFormat = 'mp3';  // Default to mp3
        if (audioFile.toLowerCase().endsWith('.wav')) {
            mediaFormat = 'wav';
        } else if (audioFile.toLowerCase().endsWith('.mp3')) {
            mediaFormat = 'mp3';
        } else if (audioFile.toLowerCase().endsWith('.mp4')) {
            mediaFormat = 'mp4';
        } else if (audioFile.toLowerCase().endsWith('.m4a')) {
            mediaFormat = 'm4a';
        }
        
        // Start transcription job
        const transcriptionJobName = `transcription-${uuidv4()}`;
        const startTranscriptionCommand = new StartTranscriptionJobCommand({
            TranscriptionJobName: transcriptionJobName,
            Media: {
                MediaFileUri: audioFile
            },
            MediaFormat: mediaFormat,
            LanguageCode: 'en-US'
        });
        
        console.log('Starting transcription job...');
        await transcribeClient.send(startTranscriptionCommand);
        
        // Wait for transcription to complete
        let transcriptionResult;
        let jobStatus = 'IN_PROGRESS';
        console.log('Waiting for transcription job to complete...');
        
        while (jobStatus === 'IN_PROGRESS') {
            await sleep(5000); // Wait 5 seconds
            
            const getJobCommand = new GetTranscriptionJobCommand({
                TranscriptionJobName: transcriptionJobName
            });
            
            const jobResult = await transcribeClient.send(getJobCommand);
            jobStatus = jobResult.TranscriptionJob.TranscriptionJobStatus;
            console.log(`Transcription status: ${jobStatus}`);
            
            if (jobStatus === 'COMPLETED') {
                // Fetch the transcript directly from the pre-signed URL
                const transcriptUri = jobResult.TranscriptionJob.Transcript.TranscriptFileUri;
                console.log(`Transcript URI: ${transcriptUri}`);
                
                try {
                    // Use https module to fetch the content directly from the URL
                    const transcriptContent = await fetchUrl(transcriptUri);
                    transcriptionResult = JSON.parse(transcriptContent).results.transcripts[0].transcript;
                    console.log('Transcription content retrieved successfully');
                } catch (error) {
                    console.error('Error fetching transcript:', error);
                    throw new Error('Failed to fetch transcript: ' + error.message);
                }
            } else if (jobStatus === 'FAILED') {
                throw new Error(`Transcription job failed: ${jobResult.TranscriptionJob.FailureReason}`);
            }
        }
        
        console.log('Transcription completed, generating summary...');
        
        // Summarize with Nova Micro
        const summary = await summarizeWithNovaMicro(transcriptionResult);
        console.log('Nova Micro summary generated successfully');
        
        console.log('Summary generated, saving to DynamoDB...');
        
        // Save to DynamoDB
        const interactionId = uuidv4();
        const putCommand = new PutItemCommand({
            TableName: 'NPCForge_Interaction',
            Item: {
                Id: { S: interactionId },
                PlayerID: { S: playerID },
                NPCID: { S: NPCID },
                Summary: { S: summary },
                GameID: { S: GameID },
                Timestamp: { S: Timestamp },
                TranscriptionText: { S: transcriptionResult },
                InteractionTime: { S: new Date().toISOString() }
            }
        });
        
        await dynamoClient.send(putCommand);
        
        console.log('Process completed successfully');
        
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: true,
                interactionId: interactionId,
                summary: summary,
                transcription: transcriptionResult,
                model: "amazon.nova-micro-v1:0"
            })
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: error.statusCode || 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: false,
                error: error.message || 'An unexpected error occurred',
                errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};