<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import GameCard from "../../components/GameCard.svelte";
  
  // Define interface for Game data structure
  interface Game {
    ImagePath: string;
    Name: string;
    Description: string;
    Id: string;
  }
  
  // State for games data and loading
  let games: Game[] = [];
  let isLoading = true;
  let error: string | null = null;
  
  // Fetch games from DynamoDB
  onMount(async () => {
    try {
      isLoading = true;
      
      // Call your server endpoint that queries DynamoDB
    const response = await fetch('/games', {
        method: 'GET',
      });
      console.log(response)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      games = data.items || [];
      
    } catch (err) {
      console.error("Failed to fetch games:", err);
      error = err instanceof Error ? err.message : 'Unknown error occurred';
    } finally {
      isLoading = false;
    }
  });
  
  // Function to navigate to create page
  const navigateToCreate = () => {
    goto('/games/create');
  };
</script>

<div class="flex flex-col items-center gap-6 py-8 px-4 pt-[20vh] relative">
  {#if isLoading}
    <div class="w-full flex justify-center items-center py-16">
      <div class="animate-pulse flex flex-col items-center">
        <div class="w-16 h-16 border-4 border-t-[#d600d6] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <p class="mt-4 text-white text-lg">Loading games...</p>
      </div>
    </div>
  {:else if error}
    <div class="w-full text-center py-16">
      <p class="text-red-500 text-lg">Error loading games: {error}</p>
      <button 
        class="mt-4 px-4 py-2 bg-[#6d4dff] rounded-lg text-white"
        on:click={() => window.location.reload()}
      >
        Try Again
      </button>
    </div>
  {:else if games.length === 0}
    <div class="w-full text-center py-16">
      <p class="text-white text-lg">No games found. Create your first one!</p>
    </div>
  {:else}
    {#each games as game (game.Id || game.Name)}
    <a href="/npcs?gameId={encodeURIComponent(game.Id)}" class="tile">
      <GameCard
        imagePath={game.ImagePath}
        gameName={game.Name}
        gameDescription={game.Description}
      />
      </a>
    {/each}
  {/if}
  
  <!-- Neon Purple Create Button -->
  <button 
    on:click={navigateToCreate}
    class="fixed bottom-8 right-8 bg-[#d600d6] hover:bg-[#e100e1] text-white py-3 px-8 rounded-lg font-semibold shadow-[0_0_15px_rgba(255,0,255,0.7)] hover:shadow-[0_0_20px_rgba(255,0,255,0.9)] transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
  >
    <span class="mr-2">Create</span>
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
    </svg>
  </button>
</div>