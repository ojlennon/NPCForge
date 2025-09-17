<!-- CreateGame.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  
  // Form data
  let gameName: string = '';
  let gameDescription: string = '';
  let imageFile: File | null = null;
  let previewUrl: string | null = null;
  let isSubmitting = false;
  let errorMessage = '';
  
  // Handle image selection
  const handleImageSelect = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      imageFile = input.files[0];
      
      // Create preview URL
      previewUrl = URL.createObjectURL(imageFile);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      isSubmitting = true;
      errorMessage = '';
      
      // Create FormData object to send files
      const formData = new FormData();
      formData.append('name', gameName);
      formData.append('description', gameDescription);
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      // Send data to server endpoint
      const response = await fetch('/games/create', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create game');
      }
      
      // Navigate back to games list on success
      goto('/games');
    } catch (error: unknown) {
    console.error('Error creating game:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error submitting form:', error);
    } finally {
      isSubmitting = false;
    }
  };
  
  // Clean up object URL on component destruction
  import { onDestroy } from 'svelte';
  onDestroy(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  });
</script>

<div class="flex items-center justify-center min-h-screen">
  <div class="max-w-3xl w-full mx-auto px-6 py-8">
    <!-- Header -->
    <h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent text-center">Create New Game</h1>
    
    <!-- Dividing line -->
    <div class="h-[2px] w-full mb-8 bg-gradient-to-r from-[#b829ff] via-[#6d4dff] to-[#39c0ff] shadow-[0_0_5px_rgba(184,41,255,0.7)]"></div>
    
    {#if errorMessage}
      <div class="bg-red-900 border border-red-500 text-white px-4 py-3 rounded-md mb-6">
        {errorMessage}
      </div>
    {/if}
    
    <!-- Form -->
    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
      <div class="flex flex-col md:flex-row gap-6">
        <!-- Left Side: Name and Description -->
        <div class="w-full md:w-1/2 space-y-4">
          <!-- Game Name -->
          <div>
            <label for="gameName" class="block text-sm font-medium text-gray-300 mb-1">Game Name</label>
            <input 
              type="text" 
              id="gameName" 
              bind:value={gameName} 
              required
              class="w-full px-4 py-3 bg-[#252532] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d600d6] focus:border-transparent transition-colors text-white"
              placeholder="Enter game name"
            />
          </div>
          
          <!-- Description -->
          <div>
            <label for="gameDescription" class="block text-sm font-medium text-gray-300 mb-1">Game Description</label>
            <textarea 
              id="gameDescription" 
              bind:value={gameDescription} 
              required
              rows="6"
              class="w-full px-4 py-3 bg-[#252532] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d600d6] focus:border-transparent transition-colors resize-none text-white"
              placeholder="Enter game description"
            ></textarea>
          </div>
        </div>
        
        <!-- Right Side: Game Cover -->
        <div class="w-full md:w-1/2">
          <label class="block text-sm font-medium text-gray-300 mb-1">Game Cover Image</label>
          
          <!-- Image upload area -->
          <div class="h-[256px]">
            {#if previewUrl}
              <div class="w-full h-full relative border border-gray-600 rounded-lg overflow-hidden bg-[#252532]">
                <img src={previewUrl} alt="Preview" class="w-full h-full object-cover" />
                <button 
                  type="button"
                  class="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1.5 hover:bg-opacity-75"
                  on:click={() => { previewUrl = null; imageFile = null; }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            {:else}
              <label 
                class="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-500 rounded-lg cursor-pointer bg-[#252532] hover:bg-[#2d2d3d] transition-colors"
              >
                <div class="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg class="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <p class="mb-1 text-sm text-gray-400">
                    <span class="font-semibold">Click to upload</span>
                  </p>
                  <p class="text-xs text-gray-400">PNG, JPG or GIF (MAX. 5MB)</p>
                </div>
                <input 
                  id="gameImage" 
                  type="file" 
                  accept="image/*" 
                  class="hidden" 
                  on:change={handleImageSelect} 
                />
              </label>
            {/if}
          </div>
        </div>
      </div>
      
      <!-- Form Actions - Neon Buttons -->
      <div class="flex justify-center space-x-6 pt-8">
        <button 
          type="button" 
          on:click={() => goto('/games')}
          class="px-6 py-3 bg-[#6d4dff] hover:bg-[#5a3dd9] rounded-lg font-medium transition-all duration-300 text-white shadow-[0_0_10px_rgba(109,77,255,0.5)] hover:shadow-[0_0_15px_rgba(109,77,255,0.8)] hover:scale-[1.02]"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        
        <button 
          type="submit" 
          class="px-8 py-3 bg-[#d600d6] hover:bg-[#c000c0] rounded-lg font-semibold text-white shadow-[0_0_10px_rgba(214,0,214,0.5)] hover:shadow-[0_0_15px_rgba(214,0,214,0.8)] transition-all duration-300 transform hover:scale-[1.02]"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Game'}
        </button>
      </div>
    </form>
  </div>
</div>