<script>
    import '../app.css';
    import { goto } from '$app/navigation';
    import { Navbar } from 'flowbite-svelte';
    import { page } from '$app/stores';
    import backgroundImage from '../images/bg1.png';
    $: currentPath = $page.url.pathname;
    $: hideHeader = currentPath === '/';
</script>

 
<div class="min-h-screen relative bg-cover bg-center bg-no-repeat" style="background-image: url('{backgroundImage}');">

  <!-- This is where page content will be injected, including the background -->
  <slot></slot>
  
  <!-- Header overlay - positioned above the page content -->
  <div class="absolute top-[-1rem] left-6 right-0 z-50">
    <header class="flex justify-between items-center px-16 py-6">
      <div class="logo">
        <a href="/" class="flex items-center no-underline text-white">
         <!-- Modern Sans Serif - Default -->
          <div class="relative inline-block px-3">
            <h1 class="text-6xl font-bold tracking-wide py-1 bg-gradient-to-br from-white via-[#d9b8ff] to-[#c499ff] bg-clip-text text-transparent">NPC FORGE</h1>
            <div class="absolute -bottom-2 left-0 h-[3px] w-[80%] bg-gradient-to-r from-[#7000ff] to-transparent"></div>
            <div class="absolute -top-1 -right-3 w-8 h-8 border-t-2 border-r-2 border-[#7000ff] opacity-80"></div>
            <div class="absolute -bottom-3 -left-3 w-8 h-8 border-b-2 border-l-2 border-[#7000ff] opacity-80"></div>
          </div>
        </a>
      </div>
      
      <nav class="lg:block hidden">
        <ul class="flex list-none m-0 p-0 gap-8">
          <li>
            <a href="/" class="nav-link relative text-white no-underline text-base font-medium py-2 hover:text-gray-300 transition-colors
              {$page.url.pathname === '/' ? 'active' : ''}">
              Home
              <span class="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-500 transform scale-x-0 transition-transform origin-left
                {$page.url.pathname === '/' ? 'scale-x-100' : ''}"></span>
            </a>
          </li>
          <li>
            <a href="/games" class="nav-link relative text-white no-underline text-base font-medium py-2 hover:text-gray-300 transition-colors
              {$page.url.pathname === '/games' ? 'active' : ''}">
              Games
              <span class="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-500 transform scale-x-0 transition-transform origin-left
                {$page.url.pathname === '/games' ? 'scale-x-100' : ''}"></span>
            </a>
          </li>
          <li>
            <a href="/npcs" class="nav-link relative text-white no-underline text-base font-medium py-2 hover:text-gray-300 transition-colors
              {$page.url.pathname === '/npcs' ? 'active' : ''}">
              NPCs
              <span class="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-500 transform scale-x-0 transition-transform origin-left
                {$page.url.pathname === '/npcs' ? 'scale-x-100' : ''}"></span>
            </a>
          </li>
          <li>
            <a href="/pricing" class="nav-link relative text-white no-underline text-base font-medium py-2 hover:text-gray-300 transition-colors
              {$page.url.pathname === '/pricing' ? 'active' : ''}">
              Pricing
              <span class="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-500 transform scale-x-0 transition-transform origin-left
                {$page.url.pathname === '/pricing' ? 'scale-x-100' : ''}"></span>
            </a>
          </li>
          <li>
            <a href="/Documentation" class="nav-link relative text-white no-underline text-base font-medium py-2 hover:text-gray-300 transition-colors
              {$page.url.pathname === '/Documentation' ? 'active' : ''}">
              Documentation
              <span class="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-500 transform scale-x-0 transition-transform origin-left
                {$page.url.pathname === '/Documentation' ? 'scale-x-100' : ''}"></span>
            </a>
          </li>
          <li>
            <a href="/Login" class="nav-link relative text-white no-underline text-base font-medium py-2 hover:text-gray-300 transition-colors
              {$page.url.pathname === '/Login' ? 'active' : ''}">
              Login
              <span class="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-500 transform scale-x-0 transition-transform origin-left
                {$page.url.pathname === '/Login' ? 'scale-x-100' : ''}"></span>
            </a>
          </li>
        </ul>
      </nav>
    </header>
  </div>
</div>