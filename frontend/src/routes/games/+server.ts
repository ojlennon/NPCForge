// src/routes/api/games/+server.ts
import { json } from '@sveltejs/kit';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import type { RequestEvent } from '@sveltejs/kit';

// Configure DynamoDB client
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' }); // Update with your region

export async function GET({ request }: RequestEvent) {
    console.log("made it")
    let resp
  try {

    // Scan the NPC_Forge_Game table
    const command = new ScanCommand({
      TableName: "NPCForge_Game",
      // Optional: Limit the results
      // Limit: 50
    });
    
    const response = await dynamoClient.send(command);
    resp = response
    // Transform DynamoDB response to regular JavaScript objects
    const items = response.Items ? response.Items.map(item => unmarshall(item)) : [];
    return json({
      success: true,
      items
    });
    
  } catch (error: unknown) {
    console.error('Error fetching games:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return json({
      success: false,
      message: 'Failed to fetch games',
      error: errorMessage
    }, { status: 500 });
  }
}