// src/routes/npcs/update/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB clients
const region = "us-east-1"; // Change to your region
const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client);

// The name of your NPCs table in DynamoDB
const NPC_TABLE_NAME = "NPCForge_NPC2"; // Replace with your actual table name

// Interface for NPC data
interface NPCData {
  NpcId: string;
  GameId: string;
  Backstory: string;
  ExampleSpeech: string;
  Gender: string;
  Accent: string;
  Information: string[];
  Name: string;
  Description: string;
  APIEvalPoint?: string;
  ImagePath: string;
}

export async function PUT({ request }: RequestEvent) {
  try {
    // Parse the JSON data from the request
    const npcData: NPCData = await request.json();
    
    // Validate required data
    if (!npcData.NpcId) {
      return json({
        success: false,
        message: 'NPC ID is required'
      }, { status: 400 });
    }
    
    // Log the data we're about to update in DynamoDB
    console.log('Updating NPC data in DynamoDB:', npcData);
    
    // Update the NPC directly in DynamoDB
    const updatedNpc = await updateNpcInDynamoDB(npcData);
    
    // Return success response with updated data
    return json({
      success: true,
      message: 'NPC updated successfully',
      npc: updatedNpc
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating NPC:', error);
    
    // Return error response
    return json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

/**
 * Update NPC data directly in DynamoDB
 */
async function updateNpcInDynamoDB(npcData: NPCData) {
  try {
    // Construct the update expression and attribute values
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};
    
    // Process each field in the NPC data
    Object.entries(npcData).forEach(([key, value]) => {
      // Skip primary key field as we don't want to update it
      if (key === 'Id') return;
      
      // Add to update expression
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    });
    
    if (updateExpressions.length === 0) {
      throw new Error('No fields to update');
    }
    
    // Create the UpdateItem command
    const command = new UpdateCommand({
      TableName: NPC_TABLE_NAME,
      Key: {
        Id: npcData.NpcId
      },
      UpdateExpression: `set ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW" // Return the updated item
    });
    
    // Execute the command to update the item in DynamoDB
    const response = await docClient.send(command);
    
    if (!response.Attributes) {
      throw new Error('No data returned after update operation');
    }
    
    console.log('NPC successfully updated in DynamoDB:', response.Attributes);
    
    // Return the updated item
    return response.Attributes as NPCData;
  } catch (error) {
    console.error('Error updating NPC in DynamoDB:', error);
    throw error;
  }
}