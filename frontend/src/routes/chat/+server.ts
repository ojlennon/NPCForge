import { json } from '@sveltejs/kit';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ url }: RequestEvent) {
  try {
    // Get NPC ID from query parameters
    const npcId = url.searchParams.get('npcId');
    
    if (!npcId) {
      return json({
        success: false,
        message: "Missing required parameter: npcId"
      }, { status: 400 });
    }
    
    console.log(`Looking up NPC with ID: ${npcId}`);
    const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
    
    // Use GetItem for direct lookup by primary key instead of scanning
    const command = new GetItemCommand({
      TableName: "NPCForge_NPC2",
      Key: {
        // Assuming 'Id' is the primary key in your DynamoDB table
        // Adjust the attribute name and type if needed
        'Id': { S: npcId }
      }
    });
    
    console.log("Sending GetItem command to DynamoDB...");
    const response = await dynamoClient.send(command);
    
    // Check if item was found
    if (!response.Item) {
      console.log(`No NPC found with ID: ${npcId}`);
      return json({
        success: false,
        message: `NPC with ID ${npcId} not found`
      }, { status: 404 });
    }
    
    // Transform DynamoDB item to regular JS object
    const npc = unmarshall(response.Item);
    console.log(`Found NPC: ${npc.Name || 'Unnamed'}`);
    
    return json({
      success: true,
      npc: npc
    });
    
  } catch (error: unknown) {
    console.error("Error fetching NPC from DynamoDB:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return json({
      success: false,
      message: "Failed to fetch NPC details",
      error: errorMessage
    }, { status: 500 });
  }
}