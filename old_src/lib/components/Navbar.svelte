<script>
  export let color = "#60a5fa"; // blue-400
  let isOpen = false;
</script>

<nav
  class="bg-transparent backdrop-blur-xl fixed top-0 left-0 right-0 z-50"
  style="--hover-color: {color}"
>
  <div class="max-w-7xl mx-auto px-6 sm:px-8 md:px-16 py-4 flex items-center justify-between">
    <a href="/" class="flex flex-row items-start">
      <img src="/gintoki-icon2.png" alt="Sakata Sensei Logo" class="w-8 h-8 sm:w-10 sm:h-10 mr-2" />
      <div class="text-blue-100 font-newtegomin text-3xl sm:text-4xl font-bold">
        Sakata Sensei
      </div>
    </a>

    <!-- desktop -->
    <div class="hidden md:flex items-center gap-6 text-white font-medium">
      <a href="/" class="hover-custom">Home</a>
      <a href="/recommend/by-list" class="hover-custom">Your List</a>
      <a href="/recommend/by-anime" class="hover-custom">Similar</a>
      <a href="/recommend/by-chat" class="hover-custom">AI Chat</a>
    </div>

    <!-- mobile -->
    <button
      class="md:hidden text-white"
      aria-label="Toggle navigation menu"
      on:click={() => (isOpen = !isOpen)}
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="{isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}"
        />
      </svg>
    </button>
  </div>

  <!-- Mobile Menu -->
  {#if isOpen}
    <div class="md:hidden px-6 pb-4 text-white font-medium space-y-2">
      <a href="/" class="block hover-custom">Home</a>
      <a href="/recommend/by-list" class="block hover-custom">Your List</a>
      <a href="/recommend/by-anime" class="block hover-custom">Similar</a>
      <a href="/recommend/by-chat" class="block hover-custom">AI Chat</a>
    </div>
  {/if}
</nav>

<style>
  a.hover-custom {
    color: white;
    transition: color 0.3s ease;
  }
  a.hover-custom:hover {
    color: var(--hover-color);
  }
</style>
