// src/routes/npcs/get/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB clients
const region = "us-east-1"; // Change to your region
const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client);

// The name of your NPCs table in DynamoDB
const NPC_TABLE_NAME = "NPCForge_NPC2"; // Replace with your actual table name
// Initialize clients

const lambdaClient = new LambdaClient({ region });

export async function GET({ url }: RequestEvent) {
  try {
    // Get NPC ID from query parameters
    const npcId = url.searchParams.get('npcId');
    
    if (!npcId) {
      return json({
        success: false,
        message: 'NPC ID is required'
      }, { status: 400 });
    }
    
    // Call AWS Lambda function to get NPC data
    const npcData = await fetchNpcData(npcId);
    
    // Return success response with data from Lambda
    return json({
      success: true,
      npc: npcData
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching NPC:', error);
    
    // Return error response
    return json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// Function to fetch NPC data from Lambda
async function fetchNpcData(npcId: string) {
  try {
    // Create the GetItem command
    const command = new GetCommand({
      TableName: NPC_TABLE_NAME,
      Key: {
        Id: npcId
      }
    });
    
    // Execute the command to get the item from DynamoDB
    const response = await docClient.send(command);
    
    // Check if the item was found
    if (!response.Item) {
      throw new Error(`NPC with ID ${npcId} not found`);
    }
    
    console.log('NPC data retrieved from DynamoDB:', response.Item);
    
    // Return the item data
    return response.Item;
  } catch (error) {
    console.error('Error fetching NPC from DynamoDB:', error);
    throw error;
  }
}