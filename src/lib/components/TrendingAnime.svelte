<script lang="ts">
	import { onMount } from 'svelte';

	let trending: any[] = [];
	let imageLoaded: boolean[] = [];

	onMount(async () => {
		const res = await fetch('/api/trending');
		trending = await res.json();
		imageLoaded = new Array(trending.length).fill(false);
	});

	function handleImageLoad(index: number) {
		imageLoaded[index] = true;
	}
</script>

<style>
	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}

	.skeleton {
		background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}
</style>

<section class="px-6 sm:px-12">
	<div class="overflow-x-auto overflow-y-hidden hide-scrollbar py-2">
		<div class="flex gap-2 sm:gap-4 pb-2">
			{#if trending.length > 0}
				{#each trending as anime, index}
					<div class="min-w-[140px] sm:min-w-[180px] rounded-xl bg-white/5 backdrop-blur-md p-2 shadow-md hover:scale-[1.03] transition duration-300">
						
						{#if imageLoaded[index]}
							<img
								src={anime.coverImage.extraLarge}
								alt={anime.title.romaji}
								class="w-full h-48 object-cover rounded-md mb-2"
								on:load={() => handleImageLoad(index)}
							/>
						{:else}
							<div class="w-full h-48 rounded-md mb-2 skeleton"></div>
							<!-- Preload image invisibly -->
							<img
								src={anime.coverImage.extraLarge}
								alt=""
								class="hidden"
								on:load={() => handleImageLoad(index)}
							/>
						{/if}

						<p class="text-sm sm:text-base text-white text-center font-medium truncate max-w-full">
							{anime.title.english || anime.title.romaji}
						</p>
					</div>
				{/each}

				<!-- to be removed -->
				<div class="min-w-[140px] sm:min-w-[180px] rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md p-2 border border-white/10 shadow-md cursor-pointer hover:scale-[1.03] transition duration-300 flex flex-col items-center justify-center text-white/60">
					<div class="w-full h-48 bg-white/10 rounded-md flex items-center justify-center">
						<span class="text-xs">+ More</span>
					</div>
					<p class="text-sm text-center mt-2">See All</p>
				</div>
			{:else}
				<!-- Skeleton placeholder -->
				{#each Array(7) as _, i}
					<div class="min-w-[140px] sm:min-w-[180px] rounded-xl bg-white/5 backdrop-blur-md p-2 shadow-md animate-pulse">
						<div class="w-full h-48 rounded-md mb-2 skeleton"></div>
						<div class="h-4 w-3/4 mx-auto rounded skeleton"></div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</section>
