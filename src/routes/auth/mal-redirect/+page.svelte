<script lang="ts">
    import { onMount } from 'svelte';

    function goTo(path: string) {
        window.location.href = path;
    }
    
    onMount(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const codeVerifier = sessionStorage.getItem("mal_code_verifier");

        if (!code || !codeVerifier) {
            alert("Missing code or code_verifier");
            return;
        }

        goTo(`/auth/mal?code=${encodeURIComponent(code)}&verifier=${encodeURIComponent(codeVerifier)}`);
    });
</script>

<section class="min-h-screen bg-gradient-to-br from-[#02020f] to-[#132d3f] relative text-white overflow-hidden">
    <div class="relative z-10 flex flex-col-reverse lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-27 pt-24 lg:pt-36 pb-5 gap-1">
        <div class="text-left w-full max-w-3xl">
            <h1 class="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
                <span class="text-blue-400 text-5xl sm:text-6xl font-black font-newtegomin">Authorization,</span><br />
            </h1>
            <p class="text-white/70 font-mono">Redirecting...</p>
        </div>
    </div>
</section>
