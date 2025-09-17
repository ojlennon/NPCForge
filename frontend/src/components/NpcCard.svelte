<!-- NpcCard.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  
  export let image: string;
  export let name: string;
  export let description: string;
  export let dateCreated: string;
  export let genre: string;
  export let textToCopy: string;
  export let chatLink: string = ""; // Prop for the chat link
  export let npcId: string = ""; // New prop for the NPC ID
  export let gameId: string = ""; // New prop for the game ID (in case needed for update)
  
  let copied = false;
  
  function copyToClipboard() {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        copied = true;
        setTimeout(() => copied = false, 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  }
  
  // Function to navigate to the update page
  function goToUpdatePage() {
    const queryParams = new URLSearchParams();
    
    if (npcId) {
      queryParams.append('npcId', npcId);
    }
    
    if (gameId) {
      queryParams.append('gameId', gameId);
    }
    
    goto(`/npcs/update?${queryParams.toString()}`);
  }
</script>

<div class="w-80 h-80 border border-gray-600 rounded-lg overflow-hidden flex flex-col bg-[#1a1a24] font-sans shadow-lg hover:shadow-xl transition-shadow duration-300 relative">
  <!-- Action buttons in the top right corner -->
  <div class="absolute top-2 right-2 z-10 flex space-x-2">
    <!-- Edit button (only shown if npcId is provided) -->
    {#if npcId}
      <button 
        on:click={goToUpdatePage}
        class="text-white/60 hover:text-white/90 transition-colors bg-black/30 hover:bg-black/40 p-1.5 rounded-full"
        title="Edit NPC"
      >
        <!-- Pencil/Edit icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
        </svg>
      </button>
    {/if}
    
    <!-- Chat link button (only shown if chatLink is provided) -->
    {#if chatLink}
      <a 
        href={chatLink} 
        target="_blank" 
        rel="noopener noreferrer"
        class="text-white/60 hover:text-white/90 transition-colors bg-black/30 hover:bg-black/40 p-1.5 rounded-full"
        title="Open chat"
      >
        <!-- Chat icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </a>
    {/if}
    
    <!-- Copy button -->
    <button 
      on:click={copyToClipboard}
      class="text-white/60 hover:text-white/90 transition-colors bg-black/30 hover:bg-black/40 p-1.5 rounded-full"
      title="Copy to clipboard"
    >
      {#if copied}
        <!-- Checkmark icon when copied -->
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      {:else}
        <!-- Copy icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
      {/if}
    </button>
  </div>
  
  <!-- Image Area -->
  <div class="h-3/5 flex items-center justify-center overflow-hidden">
    {#if image}
      <img src={image} alt={name} class="w-full h-full object-cover" />
    {:else}
      <div class="w-full h-full flex items-center justify-center bg-[#252532] text-gray-400 text-sm">
        <span>No Image</span>
      </div>
    {/if}
  </div>
  
  <!-- Info Area -->
  <div class="h-2/5 p-4 flex flex-col justify-start">
    <h3 class="text-lg font-bold mb-1.5 text-white truncate">{name}</h3>
    
    <div class="h-[1.5px] w-full mb-1.5 bg-gradient-to-r from-[#b829ff] via-[#6d4dff] to-[#39c0ff] shadow-[0_0_3px_rgba(184,41,255,0.7)]"></div>
    
    <p class="text-sm text-left text-gray-300 leading-tight line-clamp-3 overflow-ellipsis">
      {description}
    </p>
    
    <div class="text-xs text-gray-400 flex justify-between mt-auto pt-1">
      <!-- Your date and genre content if needed -->
    </div>
  </div>
</div>