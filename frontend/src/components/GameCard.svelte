<!-- GameCard.svelte -->
<script lang="ts">
  // Props for the component
  export let imagePath: string;
  export let gameName: string;
  export let gameDescription: string;
</script>

<div class="game-card flex bg-[#1a1a24] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 w-full max-w-3xl">
  <!-- Left third: Image -->
  <div class="w-1/3 relative">
    <img 
      src={imagePath} 
      alt={`${gameName} cover`} 
      class="w-full h-full object-cover"
    />
  </div>
  
  <!-- Right two-thirds: Content -->
  <div class="w-2/3 p-6 flex flex-col">
    <!-- Game name in big letters -->
    <h2 class="text-2xl font-bold text-white mb-3">{gameName}</h2>
    
    <!-- Dividing line -->
    <div class="h-[2px] w-full mb-3 bg-gradient-to-r from-[#b829ff] via-[#6d4dff] to-[#39c0ff] shadow-[0_0_5px_rgba(184,41,255,0.7)]"></div>
    
    <!-- Description in smaller letters -->
    <p class="text-gray-300 text-sm flex-grow">{gameDescription}</p>
  </div>
</div>

<style>
  .game-card {
    min-height: 160px;
  }
</style>