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

<section class="">
	<h3 class="text-2xl sm:text-3xl font-semibold mb-3">Trending Anime</h3>
	<div class="overflow-x-auto overflow-y-hidden custom-scrollbar py-2">
		
		<div class="flex gap-5 pb-2">
			{#if trending.length > 0}
				{#each trending as anime, index}
					<div class="min-w-[160px] rounded-xl bg-transparent py-2 {index == 0 ? "pl-0 pr-1" : index == (trending.length - 1) ? "pr-0 pl-1" : "px-1"} hover:scale-[1.05] transition duration-300">
						
						{#if imageLoaded[index]}
							<img
								src={anime.coverImage.extraLarge}
								alt={anime.title.romaji}
								class="w-full h-52 object-cover rounded-md mb-2"
								on:load={() => handleImageLoad(index)}
							/>
						{:else}
							<div class="w-full h-52 rounded-md mb-2 skeleton"></div>
							<!-- Preload image invisibly -->
							<img
								src={anime.coverImage.extraLarge}
								alt=""
								class="hidden"
								on:load={() => handleImageLoad(index)}
							/>
						{/if}

						<div class="mb-2 flex flex-row items-left">
							<div class="w-[9px] h-[9px] my-1.5 mr-1.5 shrink-0 rounded-full {anime.status == 'RELEASING' ? "bg-lime-400" : "bg-blue-400"}"></div>
							<div class="text-sm font-semibold text-white hover:text-[{anime.coverImage.color}] truncate max-w-full">
								{anime.title.english || anime.title.romaji}
							</div>
						</div>
						<div class="flex flex-row items-left">
							<div class="text-sm font-bold font-mono rounded-sm bg-white/5 text-gray-400 px-1.5 py-0.5 mr-2">
								{anime.format}
							</div>
							<div class="text-sm font-bold font-mono rounded-sm bg-white/5 text-gray-400 px-1.5 py-0.5 mr-2">
								{anime.startDate.year}
							</div>
							<div class="text-sm font-bold font-mono rounded-sm bg-white/5 text-gray-400 px-1.5 py-0.5 inline-flex items-center gap-1">
								<!-- outlined star SVG -->
								<svg class="w-4 h-4 relative -translate-y-[1px]" viewBox="0 0 24 24" fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
									focusable="true"
								>
									<title>Rating</title>
									<path d="M12 17.3L7.3 20l1.1-5.2L4 11.5l5.3-.5L12 6l2.7 5 5.3.5-4.4 3.3L16.7 20z"/>
								</svg>
								{anime.meanScore}
							</div>
						</div>
					</div>
				{/each}

			{:else}
				<!-- Skeleton placeholder -->
				{#each Array(20) as _, i}
					<div class="min-w-[160px] rounded-xl p-2 animate-pulse gap-2">
						<div class="w-full h-50 rounded-md mb-2 skeleton"></div>
						<div class="h-4 w-3/4 rounded mb-2 skeleton"></div>
						<div class="h-4 w-2/4 rounded skeleton"></div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</section>

<style>
@keyframes shimmer {
  0%   { background-position: 0 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: repeating-linear-gradient(
    90deg,
	rgba(255,255,255,0.050) 0%,
    rgba(255,255,255,0.050) 5%,

    rgba(255, 255, 255, 0.110) 45%,
	rgba(255, 255, 255, 0.110) 55%,

    rgba(255,255,255,0.050) 95%,
	rgba(255,255,255,0.050) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s linear infinite;
}


	.custom-scrollbar::-webkit-scrollbar {
		height: 10px;
		width: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	/* Firefox */
	.custom-scrollbar {
		scrollbar-width: thick;
		scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
	}
</style>