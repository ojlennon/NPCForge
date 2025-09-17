#!/usr/bin/env bash

# Array of directories
directories=("fetch_history" "process_transcription" "save_game" "save_npc")

# Loop through each directory
for dir in "${directories[@]}"; do
    echo "Processing $dir..."
    
    # Create directory if it doesn't exist
    mkdir -p "$dir"
    
    # Enter directory
    cd "$dir"
    
    # Install dependencies
    echo "Installing dependencies in $dir..."
    npm install
    
    # Create zip file
    echo "Creating zip file for $dir..."
    zip -r "${dir}.zip" ./* -x "node_modules/.git/*"
    
    # Move back to parent directory
    cd ..
    
    echo "Completed processing $dir"
    echo "------------------------"
done

echo "All operations completed!"