<script>
	let isOpen = false;
</script>

<nav class="bg-transparent backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
	<div class="max-w-7xl mx-auto px-6 sm:px-8 md:px-16 py-4 flex items-center justify-between">
		<!-- ee -->
		<a href="/" class="text-blue-400 font-newtegomin text-2xl sm:text-3xl font-bold">
			Sakata Sensei
		</a>

		<!-- desktop -->
		<div class="hidden md:flex items-center gap-6 text-white font-medium">
			<a href="/" class="hover:text-blue-400 transition">Home</a>
			<a href="/reccomend/by-list" class="hover:text-blue-400 transition">Your List</a>
			<a href="/reccomend/by-anime" class="hover:text-blue-400 transition">Similar</a>
			<a href="/reccomend/by-chat" class="hover:text-blue-400 transition">AI Chat</a>
		</div>

		<!-- mobile -->
		<button class="md:hidden text-white" aria-label="Toggle navigation menu" on:click={() => (isOpen = !isOpen)}>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
					d="{isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}" />
			</svg>
		</button>
	</div>

	<!-- Mobile Menu -->
	{#if isOpen}
		<div class="md:hidden px-6 pb-4 text-white font-medium space-y-2">
			<a href="/" class="block hover:text-blue-400 transition">Home</a>
			<a href="/reccomend/by-list" class="block hover:text-blue-400 transition">Your List</a>
			<a href="/reccomend/by-anime" class="block hover:text-blue-400 transition">Similar</a>
			<a href="/reccomend/by-chat" class="block hover:text-blue-400 transition">AI Chat</a>
		</div>
	{/if}
</nav>