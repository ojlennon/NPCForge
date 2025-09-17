<!-- CreateNpc.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  // Form data
  let name: string = "";
  let description: string = "";
  let backstory: string = "";
  let exampleSpeech: string = "";
  let gender: string = "male";
  let accent: string = "american";
  let informationItems: string[] = [""];
  let imageFile: File | null = null;
  let previewUrl: string | null = null;
  let isSubmitting: boolean = false;
  $: gameId = $page.url.searchParams.get('gameId') || null;

  // Handle image selection
  const handleImageSelect = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      imageFile = input.files[0];

      // Create preview URL
      previewUrl = URL.createObjectURL(imageFile);
    }
  };

  // Add new information item
  const addInformationItem = () => {
    informationItems = [...informationItems, ""];
  };

  // Remove information item
  const removeInformationItem = (index: number) => {
    informationItems = informationItems.filter((_, i) => i !== index);
  };

  // Handle form submission
  // Handle form submission
  async function handleSubmit() {
    let isSubmitting = true;
    try {
      // Show loading state

      // Create FormData object to send file and text data together
      const formData = new FormData();

      // Add text fields
      formData.append("GameId", gameId!);
      formData.append("Name", name);
      formData.append("Description", description);
      formData.append("Backstory", backstory);
      formData.append("ExampleSpeech", exampleSpeech);
      formData.append("Gender", gender);
      formData.append("Accent", accent);

      // Add information items (filtering out empty ones)
      informationItems
        .filter((item) => item.trim() !== "")
        .forEach((item, index) => {
          formData.append(`Information[${index}]`, item);
        });

      // Add image file if present
      if (imageFile) {
        formData.append("imageFile", imageFile);
      }

      formData.append("GameId", gameId!);
      // Submit the form data to our server-side endpoint
      const response = await fetch("/npcs/create", {
        method: "POST",
        body: formData,
        // No need to set Content-Type header - it's automatically set with boundary for FormData
      });

      // Process the response
      const result = await response.json();
      console.log(result)
      if (!response.ok || !result.success) {
        throw new Error(
          result.message || `Error: ${response.status} ${response.statusText}`
        );
      }

      // Show success message
      console.log(`NPC "${result.npc.Name}" created successfully!`);

      // Navigate back to NPCs list
      goto("/npcs");
    } catch (error) {
      // Display error to user
      console.error("Failed to create NPC:", error);
      alert(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      // Reset loading state
      isSubmitting = false;
    }
  }

  // Clean up object URL on component destruction
  import { onDestroy } from "svelte";
  onDestroy(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  });
</script>

<div class="flex items-center justify-center min-h-screen">
  <div class="max-w-3xl w-full mx-auto px-6 py-8">
    <!-- Header -->
    <h1
      class="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent text-center"
    >
      Create New NPC
    </h1>

    <!-- Dividing line -->
    <div
      class="h-[2px] w-full mb-8 bg-gradient-to-r from-[#b829ff] via-[#6d4dff] to-[#39c0ff] shadow-[0_0_5px_rgba(184,41,255,0.7)]"
    ></div>

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
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1"
              >NPC Image</label
            >
            <div class="h-[46px]">
              <!-- Height matching a standard input -->
              {#if previewUrl}
                <div
                  class="w-full h-full relative border border-gray-600 rounded-lg overflow-hidden bg-[#252532]"
                >
                  <img
                    src={previewUrl}
                    alt="Preview"
                    class="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    class="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-75"
                    on:click={() => {
                      previewUrl = null;
                      imageFile = null;
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3 w-3"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              {:else}
                <label
                  class="flex items-center px-4 w-full h-full border border-gray-600 rounded-lg cursor-pointer bg-[#252532] hover:bg-[#2d2d3d] transition-colors"
                >
                  <svg
                    class="w-4 h-4 mr-2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    ></path>
                  </svg>
                  <span class="text-sm text-gray-400 font-semibold"
                    >Click to upload image</span
                  >
                  <input
                    id="npcImage"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    on:change={handleImageSelect}
                  />
                </label>
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
          <!-- Increased spacing between items -->
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
            Creating...
          {:else}
            Create NPC
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>
