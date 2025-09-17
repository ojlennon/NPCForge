<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { onMount, onDestroy } from "svelte";
  import landingBg1 from "../images/landing-bg.png";
  import landingBg2 from "../images/landing-bg2.png";
  import landingBg3 from "../images/call-of-duty.png";
  import landingBg4 from "../images/Anime-gpt-boy.png";

  // Create an array of images for the carousel
  const images: string[] = [landingBg1, landingBg2, landingBg3, landingBg4];
  let currentIndex: number = 0;

  // Function to navigate to a specific slide
  const goToSlide = (index: number): void => {
    currentIndex = index;
  };

  // Functions for navigation buttons
  const prevSlide = (): void => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
  };

  const nextSlide = (): void => {
    currentIndex = (currentIndex + 1) % images.length;
  };

  // For transition direction tracking
  let slideDirection: 1 | -1 = 1;

  // Auto-rotation functionality
  let rotationInterval: ReturnType<typeof setInterval> | null = null;
  let isAutoRotating: boolean = true;
  const rotationDelay: number = 3000; // 5 seconds

  const startAutoRotation = (): void => {
    if (rotationInterval) clearInterval(rotationInterval);
    isAutoRotating = true;
    rotationInterval = setInterval(() => {
      slideDirection = 1;
      nextSlide();
    }, rotationDelay);
  };

  const stopAutoRotation = (): void => {
    if (rotationInterval) {
      clearInterval(rotationInterval);
      rotationInterval = null;
    }
    isAutoRotating = false;
  };

  // Pause rotation when user interacts, resume after a delay
  const pauseAutoRotation = (): void => {
    stopAutoRotation();
    setTimeout(() => {
      if (!isAutoRotating) startAutoRotation();
    }, 10000); // Resume after 10 seconds of inactivity
  };

  onMount(() => {
    startAutoRotation();
  });

  onDestroy(() => {
    stopAutoRotation();
  });
</script>

<!-- Main container taking full viewport height -->
<div
  class="absolute inset-0 font-['Inter',sans-serif] overflow-hidden"
  on:mouseenter={stopAutoRotation}
  on:mouseleave={startAutoRotation}
  role="region"
  aria-label="Image carousel"
>
  <!-- Carousel images with sliding animation -->
  {#each images as image, i}
    {#if i === currentIndex}
      <div
        class="absolute inset-0"
        in:fly={{ x: 100 * slideDirection, duration: 500, easing: cubicOut }}
        out:fly={{ x: -100 * slideDirection, duration: 500, easing: cubicOut }}
      >
        <img
          src={image}
          alt={`background ${i + 1}`}
          class="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    {/if}
  {/each}

  <!-- Background overlays -->
  <!-- <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.3)_75%)]"></div> -->

  <!-- Content -->
  <div
    class="relative flex flex-col items-center justify-between h-full px-16 pt-32 z-10"
  >
    <div class="max-w-xl self-start mt-[25vh]">
      <!-- <div class="text-lg font-bold text-gray-400 mb-4">0{currentIndex + 1}</div> -->
      <!-- <h1 class="text-3xl font-extrabold leading-tight text-white mb-8">Plug and play<br />AI speech NPCs</h1> -->
    </div>

    <!-- Numbered navigation in the style from the image -->
    <div class="mb-10 flex items-center">
      <!-- Previous arrow -->
      <button
        on:click={() => {
          slideDirection = -1;
          prevSlide();
          pauseAutoRotation();
        }}
        class="text-white opacity-70 hover:opacity-100 mx-2"
        aria-label="Previous slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path
            fill-rule="evenodd"
            d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
          />
        </svg>
      </button>

      {#each images as _, i}
        <button
          class={`w-16 h-1 mx-1 transition-all duration-300 rounded-sm ${i === currentIndex ? "bg-gradient-to-r from-pink-500 to-purple-600 shadow-[0_0_8px_rgba(219,39,119,0.5)]" : "bg-gray-700 opacity-40 hover:opacity-60"}`}
          on:click={() => {
            slideDirection = i > currentIndex ? 1 : -1;
            goToSlide(i);
            pauseAutoRotation();
          }}
          aria-label={`Go to slide ${i + 1}`}
        >
        </button>
      {/each}

      <!-- Next arrow -->
      <button
        on:click={() => {
          slideDirection = 1;
          nextSlide();
          pauseAutoRotation();
        }}
        class="text-white opacity-70 hover:opacity-100 mx-2"
        aria-label="Next slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path
            fill-rule="evenodd"
            d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
          />
        </svg>
      </button>
    </div>
  </div>
  
</div>
