<script lang="ts">
	import { onMount } from 'svelte';
	let trending: any[] = [];
	let imageLoaded: boolean[] = [];
	let hoveringIndex: number | null = null;

	onMount(async () => {
		const res = await fetch('/api/trending');
		trending = await res.json();
		imageLoaded = new Array(trending.length).fill(false);
	});

	function handleImageLoad(index: number) {
		imageLoaded[index] = true;
	}
</script>

<section>
	<h3 class="text-xl sm:text-2xl font-semibold mb-3">Trending Anime</h3>
	<div class="overflow-x-auto overflow-y-hidden custom-scrollbar py-2">
		<div class="flex gap-2 sm:gap-5 pb-2">
			{#if trending.length > 0}
				{#each trending as anime, index}
					
					<div
						class="group min-w-[130px] sm:min-w-[160px] rounded-xl bg-transparent py-1 sm:py-2 px-1 hover:scale-[1.05] transition duration-300"
						role="presentation"
						on:mouseenter={() => hoveringIndex = index}
						on:mouseleave={() => hoveringIndex = null}
					>
						{#if imageLoaded[index]}
							<img src={anime.coverImage.extraLarge} alt={anime.title.romaji} class="w-full h-40 sm:h-52 rounded-md mb-1.5 sm:mb-3" on:load={() => handleImageLoad(index)} />
						{:else}
							<div class="w-full h-40 sm:h-52 rounded-md mb-1.5 sm:mb-3 skeleton"></div>
							<img src={anime.coverImage.extraLarge} alt="" class="hidden" on:load={() => handleImageLoad(index)} />
						{/if}

						<div class="mb-1 sm:mb-2 flex flex-row items-left">
							<div class="w-[8px] h-[8px] sm:w-[9px] sm:h-[9px] my-1 sm:mt-1.5 sm:mb-1 mr-1.5 shrink-0 rounded-full {anime.status == 'RELEASING' ? 'bg-lime-400' : anime.status == 'FINISHED' ? 'bg-blue-400' : 'bg-orange-300'}"></div>
							<div
								class="text-xs sm:text-sm font-semibold transition-colors duration-300 truncate max-w-full"
								style="color: {hoveringIndex === index && anime.coverImage.color ? anime.coverImage.color : 'white'}"
							>
								{anime.title.english || anime.title.romaji}
							</div>
						</div>

						<div class="flex flex-row items-left flex-wrap gap-1.5 sm:gap-2">
							<div class="text-[10px] sm:text-sm font-bold font-mono rounded-sm bg-white/5 text-gray-400 group-hover:text-gray-300 px-1 py-0.5  transition-colors duration-300">
								{anime.format}
							</div>

							<div class="text-[10px] sm:text-sm font-bold font-mono rounded-sm bg-white/5 text-gray-400 group-hover:text-gray-300 px-1 py-0.5  transition-colors duration-300">
								{anime.startDate.year}
							</div>

							<div class="text-[10px] sm:text-sm font-bold font-mono rounded-sm bg-white/5 text-gray-400 group-hover:text-gray-300 px-1 py-0.5 inline-flex items-center gap-1 transition-colors duration-300">
								<svg class="w-3 sm:w-4 h-3 sm:h-4 relative -translate-y-[1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" >
									<path d="M12 17.3L7.3 20l1.1-5.2L4 11.5l5.3-.5L12 6l2.7 5 5.3.5-4.4 3.3L16.7 20z" />
								</svg>
								{anime.meanScore}
							</div>

						</div>
					</div>
				{/each}
			{:else}
				<!-- Skeleton loader -->
				{#each Array(20) as _, i}
					<div class="min-w-[130px] sm:min-w-[160px] rounded-xl px-1" >
						<div class="w-full h-40 sm:h-52 rounded-md mb-1.5 sm:mb-3 skeleton"></div>
						<div class="h-[12px] sm:h-[18px] w-3/4 rounded-sm mb-1.5 sm:mb-3 skeleton"></div>
						<div class="h-[12px] sm:h-[18px] w-2/4 rounded-sm skeleton"></div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</section>

<style>
@keyframes shimmer {
	0% {
		background-position: 0 0;
	}
	100% {
		background-position: 200% 0;
	}
}

.skeleton {
	background: repeating-linear-gradient(
		90deg,
		rgba(255, 255, 255, 0.05) 0%,
		rgba(255, 255, 255, 0.05) 5%,
		rgba(255, 255, 255, 0.11) 45%,
		rgba(255, 255, 255, 0.11) 55%,
		rgba(255, 255, 255, 0.05) 95%,
		rgba(255, 255, 255, 0.05) 100%
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
