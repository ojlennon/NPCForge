import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Configure AWS clients
const lambdaClient = new LambdaClient({ region: 'us-east-1' }); // Update with your region
const s3Client = new S3Client({ region: 'us-east-1' }); // Update with your region
const BUCKET_NAME = 'npcforge-images'; // Update with your bucket name

export async function POST({ request }: RequestEvent) {
  try {
    
    const formData = await request.formData();
    
    const gameName = formData.get('name') as string;
    const gameDescription = formData.get('description') as string;
    const imageFile = formData.get('image') as File;
    
    // Upload image to S3 if one was provided
    let imagePath = '';
    if (imageFile && imageFile.size > 0) {
      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `games/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
      
      // Upload to S3
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: Buffer.from(await imageFile.arrayBuffer()),
        ContentType: imageFile.type
      }));
      
      imagePath = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
    }
    
    // Prepare data for Lambda
    const gameData = {
      Name: gameName,
      Description: gameDescription,
      ImagePath: imagePath
    };
    
    // Call Lambda function
    const command = new InvokeCommand({
      FunctionName: 'saveGame', // Replace with your Lambda function name
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(gameData)
    });
    
    const response = await lambdaClient.send(command);
    
    // Parse Lambda response
    const responsePayload = new TextDecoder().decode(response.Payload);
    const parsedPayload = JSON.parse(responsePayload);
    
    return json({
      success: true,
      message: 'Game created successfully',
      data: parsedPayload
    });
    
  } catch (error: unknown) {
    console.error('Error creating game:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return json({
      success: false,
      message: 'Failed to create game',
      error: errorMessage
    }, { status: 500 });
  }
}