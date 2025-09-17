import { json } from '@sveltejs/kit';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ url }: RequestEvent) {
  try {
    // Get GameId from query parameters
    const GameId = url.searchParams.get('gameId');
    
    console.log("Creating DynamoDB client...");
    const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
    
    console.log("Setting up scan command for table: NPCForge_NPC");
    const command = new ScanCommand({
      TableName: "NPCForge_NPC2",
      Limit: 50 // Limit results for performance
    });
    
    console.log("Sending scan command to DynamoDB...");
    const response = await dynamoClient.send(command);
    console.log("Response received, items count:", response.Items?.length || 0);
    
    // Transform DynamoDB items to regular JS objects
    let items = response.Items ? response.Items.map(item => unmarshall(item)) : [];
    
    // Filter items by GameId if provided
    if (GameId) {
      console.log(`Filtering NPCs by GameId: ${GameId}`);
      items = items.filter(item => item.GameId === GameId);
      console.log(`Found ${items.length} NPCs for game ${GameId}`);
    }
    
    return json({
      success: true,
      items: items
    });
    
  } catch (error: unknown) {
    console.error("Error fetching NPCs from DynamoDB:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return json({
      success: false,
      message: "Failed to fetch NPCs",
      error: errorMessage
    }, { status: 500 });
  }
}