<!-- UpdateNpc.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { onMount } from "svelte";

  // Form data
  let name: string = "";
  let description: string = "";
  let backstory: string = "";
  let exampleSpeech: string = "";
  let gender: string = "male";
  let accent: string = "american";
  let informationItems: string[] = [""];
  let previewUrl: string | null = null;
  let isSubmitting: boolean = false;
  let isLoading: boolean = true;
  let errorMessage: string | null = null;

  $: npcId = $page.url.searchParams.get('npcId') || null;
  $: gameId = $page.url.searchParams.get('gameId') || null;

  // Fetch NPC data on component mount
  onMount(async () => {
    if (!npcId) {
      errorMessage = "No NPC ID provided";
      isLoading = false;
      return;
    }

    try {
      const response = await fetch(`/npcs/get?npcId=${npcId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to load NPC data");
      }

      // Populate form with NPC data
      const npc = result.npc;
      name = npc.Name;
      description = npc.Description;
      backstory = npc.Backstory || "";
      exampleSpeech = npc.ExampleSpeech || "";
      gender = npc.Gender || "male";
      accent = npc.Accent || "american";
      
      // Handle information items
      if (npc.Information && Array.isArray(npc.Information) && npc.Information.length > 0) {
        informationItems = npc.Information;
      } else {
        informationItems = [""];
      }

      // Handle image preview if available
      if (npc.ImagePath) {
        previewUrl = npc.ImagePath;
      }

    } catch (error) {
      console.error("Error fetching NPC data:", error);
      errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    } finally {
      isLoading = false;
    }
  });

  // Add new information item
  const addInformationItem = () => {
    informationItems = [...informationItems, ""];
  };

  // Remove information item
  const removeInformationItem = (index: number) => {
    informationItems = informationItems.filter((_, i) => i !== index);
  };

  // Handle form submission
  async function handleSubmit() {
    isSubmitting = true;
    try {
      // Create object with updated NPC data
      const updatedNpcData = {
        NpcId: npcId,
        GameId: gameId,
        Name: name,
        Description: description,
        Backstory: backstory,
        ExampleSpeech: exampleSpeech,
        Gender: gender,
        Accent: accent,
        Information: informationItems.filter(item => item.trim() !== ""),
        ImagePath: previewUrl || ""
      };

      // Submit the update request
      const response = await fetch("/npcs/update", {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedNpcData),
      });

      // Process the response
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(
          result.message || `Error: ${response.status} ${response.statusText}`
        );
      }

      // Show success message
      console.log(`NPC "${result.npc.Name}" updated successfully!`);
      
      // Navigate back to NPCs list
      goto("/npcs");
    } catch (error) {
      // Display error to user
      console.error("Failed to update NPC:", error);
      alert(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      // Reset loading state
      isSubmitting = false;
    }
  }
</script>

<div class="flex items-center justify-center min-h-screen">
  <div class="max-w-3xl w-full mx-auto px-6 py-8">
    <!-- Header -->
    <h1
      class="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent text-center"
    >
      Update NPC
    </h1>
    <!-- Dividing line -->
    <div
      class="h-[2px] w-full mb-8 bg-gradient-to-r from-[#b829ff] via-[#6d4dff] to-[#39c0ff] shadow-[0_0_5px_rgba(184,41,255,0.7)]"
    ></div>

    {#if isLoading}
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    {:else if errorMessage}
      <div class="bg-red-500 bg-opacity-20 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
        <p>{errorMessage}</p>
        <button 
          on:click={() => goto("/npcs")} 
          class="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-white">
          Back to NPCs
        </button>
      </div>
    {:else}
      <!-- Form -->
      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <div class="flex flex-col md:flex-row gap-6">
          <!-- Left Side: Basic Info -->
          <div class="w-full md:w-1/2 space-y-4">
            <!-- Name -->
            <div>
              <label
                for="name"
                class="block text-sm font-medium text-gray-300 mb-1"
                >NPC Name</label
              >
              <input
                type="text"
                id="name"
                bind:value={name}
                required
                class="w-full px-4 py-4 bg-[#252532] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d600d6] focus:border-transparent transition-colors text-white"
                placeholder="Enter NPC name"
              />
            </div>
            <!-- Gender Dropdown -->
            <div>
              <label
                for="gender"
                class="block text-sm font-medium text-gray-300 mb-1">Gender</label
              >
              <select
                id="gender"
                bind:value={gender}
                class="w-full px-4 py-3 bg-[#252532] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d600d6] focus:border-transparent transition-colors text-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </div>
            <!-- Accent Dropdown -->
            <div>
              <label
                for="accent"
                class="block text-sm font-medium text-gray-300 mb-1">Accent</label
              >
              <select
                id="accent"
                bind:value={accent}
                class="w-full px-4 py-3 bg-[#252532] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d600d6] focus:border-transparent transition-colors text-white"
              >
                <option value="american">American</option>
                <option value="british">British</option>
              </select>
            </div>
            <!-- Description -->
            <div>
              <label
                for="description"
                class="block text-sm font-medium text-gray-300 mb-1"
                >Description</label
              >
              <textarea
                id="description"
                bind:value={description}
                required
                rows="3"
                class="w-full px-4 py-3 bg-[#252532] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d600d6] focus:border-transparent transition-colors resize-none text-white"
                placeholder="Brief description of the NPC"
              ></textarea>
            </div>
          </div>
          <!-- Right Side: Image & Detailed Info -->
          <div class="w-full md:w-1/2 space-y-4">
            <!-- Backstory -->
            <div>
              <label
                for="backstory"
                class="block text-sm font-medium text-gray-300 mb-1"
                >Backstory</label
              >
              <textarea
                id="backstory"
                bind:value={backstory}
                rows="5"
                class="w-full px-4 py-3 bg-[#252532] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d600d6] focus:border-transparent transition-colors resize-none text-white"
                placeholder="Character's backstory and history"
              ></textarea>
            </div>
            <!-- NPC Image (Display only) -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1"
                >NPC Image</label
              >
              <div class="h-[46px]">
                {#if previewUrl}
                  <div
                    class="w-full h-full relative border border-gray-600 rounded-lg overflow-hidden bg-[#252532]"
                  >
                    <img
                      src={previewUrl}
                      alt="NPC Image"
                      class="w-full h-full object-cover"
                    />
                  </div>
                {:else}
                  <div class="w-full h-full border border-gray-600 rounded-lg bg-[#252532] flex items-center justify-center">
                    <span class="text-gray-400 text-sm">No image available</span>
                  </div>
                {/if}
              </div>
            </div>
            <!-- Example Speech -->
            <div>
              <label
                for="exampleSpeech"
                class="block text-sm font-medium text-gray-300 mb-1"
                >Example Speech</label
              >
              <textarea
                id="exampleSpeech"
                bind:value={exampleSpeech}
                rows="3"
                class="w-full px-4 py-3 bg-[#252532] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d600d6] focus:border-transparent transition-colors resize-none text-white"
                placeholder="Example of how the character speaks"
              ></textarea>
            </div>
          </div>
        </div>
        <!-- Information to Convey (Full Width) -->
        <div>
          <div class="mb-1">
            <label class="block text-sm font-medium text-gray-300"
              >Information to Convey</label
            >
          </div>
          <div class="space-y-4">
            {#each informationItems as item, index}
              <div class="flex items-center">
                <div class="mr-2 text-gray-400">{index + 1}.</div>
                <input
                  type="text"
                  bind:value={informationItems[index]}
                  on:input={(e) => {
                    // Cast event target to HTMLInputElement
                    const input = e.target as HTMLInputElement;
                    // If typing in the last input and it's not empty, add a new empty input
                    if (
                      index === informationItems.length - 1 &&
                      input.value.trim() !== ""
                    ) {
                      addInformationItem();
                    }
                  }}
                  class="flex-grow px-4 py-2 bg-[#252532] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d600d6] focus:border-transparent transition-colors text-white"
                  placeholder="Important information this NPC should convey"
                />
                {#if informationItems.length > 1}
                  <button
                    type="button"
                    on:click={() => removeInformationItem(index)}
                    class="ml-2 text-white hover:text-red-300"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        </div>
        <!-- Form Actions - Neon Buttons -->
        <div class="flex justify-center space-x-6 pt-8">
          <button
            type="button"
            on:click={() => goto("/npcs")}
            class="px-6 py-3 bg-[#6d4dff] hover:bg-[#5a3dd9] rounded-lg font-medium transition-all duration-300 text-white shadow-[0_0_10px_rgba(109,77,255,0.5)] hover:shadow-[0_0_15px_rgba(109,77,255,0.8)] hover:scale-[1.02]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            class="px-8 py-3 bg-[#d600d6] hover:bg-[#c000c0] rounded-lg font-semibold text-white shadow-[0_0_10px_rgba(214,0,214,0.5)] hover:shadow-[0_0_15px_rgba(214,0,214,0.8)] transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isSubmitting}
              Updating...
            {:else}
              Update NPC
            {/if}
          </button>
        </div>
      </form>
    {/if}
  </div>
</div>