// src/routes/npcs/create/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize clients
const region = "us-east-1"; // Change to your region
const lambdaClient = new LambdaClient({ region,});
const s3Client = new S3Client({ region});

// S3 bucket configuration
const BUCKET_NAME = "npcforge-images"; // Your bucket name
const NPC_PREFIX = "npc/"; // Subdirectory for NPCs

// Interface for NPC data
interface NPCData {
  GameId: string;
  Backstory: string;
  ExampleSpeech: string;
  Gender: string;
  Accent: string;
  Information: string[]; // Assuming this is an array of strings
  Name: string;
  Description: string;
  APIEvalPoint: string;
  ImagePath: string;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Parse the form data from the request
    const formData = await request.formData();
    
    // Extract text fields
    const name = formData.get('Name') as string;
    const description = formData.get('Description') as string;
    const backstory = formData.get('Backstory') as string;
    const exampleSpeech = formData.get('ExampleSpeech') as string;
    const gender = formData.get('Gender') as string;
    const accent = formData.get('Accent') as string;
    const gameId = formData.get('GameId') as string;
    
    // Extract information items (multiple values with same key)
    const informationItems: string[] = [];
    formData.forEach((value, key) => {
      if (key.startsWith('informationItems[')) {
        informationItems.push(value as string);
      }
    });
    
    // Handle image file if present
    let imageUrl: string | undefined = undefined;
    const imageFile = formData.get('imageFile') as File;
    
    if (imageFile && imageFile.size > 0) {
      // Upload to S3
      imageUrl = await uploadImageToS3(imageFile);
    }
    
    // Construct the NPC data object
    const npcData = {
    GameId: gameId, // Default value or you could get this from somewhere
    Backstory: backstory,
    ExampleSpeech: exampleSpeech,
    Gender: gender,
    Accent: accent,
    Information: informationItems, // Keeping as array
    Name: name,
    Description: description,
    APIEvalPoint: "character_interaction_v1", // Default value
    ImagePath: imageUrl || "" // Use uploaded image URL or empty string
    };
    
    // Log the data we're about to send
    console.log('Sending NPC data to Lambda:', npcData);
    
    // Call AWS Lambda function
    const lambdaResponse = await callCreateNpcLambda(npcData);
    
    // Return success response with data from Lambda
    return json({
      success: true,
      message: 'NPC created successfully',
      npc: lambdaResponse
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating NPC:', error);
    
    // Return error response
    return json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
};

/**
 * Upload an image file to S3
 */
/**
 * Upload an image file to S3
 */
async function uploadImageToS3(file: File): Promise<string> {
  // Generate a unique key for the image
  const timestamp = Date.now();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${NPC_PREFIX}${timestamp}-${safeFileName}`;
  
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Set up the S3 upload parameters
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    };
    
    // Upload the file to S3
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    
    // Construct the URL for the uploaded file
    const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
    
    console.log(`Successfully uploaded image to S3: ${url}`);
    return url;
  } catch (error) {
    console.error()
    console.error('Error uploading image to S3:', error);
    throw new Error('Failed to upload image' + error);
  }
}

// Function to call AWS Lambda using AWS SDK v3
async function callCreateNpcLambda(npcData: NPCData) {
  try {
    // Create the Lambda invoke command
    const command = new InvokeCommand({
      FunctionName: "saveNPC", // Replace with your actual Lambda function name
      InvocationType: "RequestResponse", // Synchronous invocation
      Payload: JSON.stringify(npcData),
    });
    console.log(JSON.stringify(npcData))
    
    // Send the command to invoke the Lambda
    const response = await lambdaClient.send(command);
    
    // Check for Lambda execution errors
    if (response.FunctionError) {
      throw new Error(`Lambda execution failed: ${response.FunctionError}`);
    }
    
    // Extract and parse the payload (response data)
    if (!response.Payload) {
      throw new Error('No response payload received from Lambda');
    }
    
    // Convert UInt8Array to string
    const textDecoder = new TextDecoder('utf-8');
    const responseJson = textDecoder.decode(response.Payload);
    
    // Parse and return the response
    return JSON.parse(JSON.stringify(npcData));
  } catch (error) {
    console.error('Error calling Lambda:', error);
    throw error;
  }
}