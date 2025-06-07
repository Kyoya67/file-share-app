/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
};

module.exports = nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
// Use dynamic import for ESM module
(async () => {
    try {
        const { initOpenNextCloudflareForDev } = await import("@opennextjs/cloudflare");
        initOpenNextCloudflareForDev();
    } catch (error) {
        console.error("Error initializing OpenNext Cloudflare for dev:", error);
    }
})();
