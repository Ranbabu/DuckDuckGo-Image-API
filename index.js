export default {
  async fetch(request) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    if (!query) {
      return new Response(JSON.stringify({ error: "हेडलाइन खाली है।" }), { status: 400, headers: corsHeaders });
    }

    try {
      // Bing HD Image Search (यह Cloudflare को ब्लॉक नहीं करता और एकदम गूगल जैसे रिज़ल्ट देता है)
      const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
      
      const response = await fetch(searchUrl, {
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          // यह भारत की असली न्यूज़ साइट्स को प्राथमिकता देगा
          "Accept-Language": "hi-IN,hi;q=0.9,en-US;q=0.8,en;q=0.7",
          // 🔥 सबसे ज़रूरी: SafeSearch STRICT (इससे कोई भी गलत या फालतू इमेज नहीं आएगी)
          "Cookie": "SRCHHPGUSR=ADLT=STRICT;" 
        }
      });
      
      const html = await response.text();
      let images = [];
      
      // असली HD इमेज निकालने का तरीका
      const regex1 = /murl&quot;:&quot;(.*?)&quot;/g;
      let match;
      while ((match = regex1.exec(html)) !== null) {
        let imgUrl = match[1];
        if (imgUrl.startsWith("http") && !images.includes(imgUrl)) {
          images.push(imgUrl);
        }
      }

      // बैकअप तरीका (अगर पहला काम न करे)
      if (images.length === 0) {
        const regex2 = /"murl":"(.*?)"/g;
        while ((match = regex2.exec(html)) !== null) {
          let imgUrl = match[1];
          if (imgUrl.startsWith("http") && !images.includes(imgUrl)) {
            images.push(imgUrl);
          }
        }
      }

      if (images.length === 0) {
        return new Response(JSON.stringify({ error: "इस हेडलाइन से जुड़ी कोई तस्वीर नहीं मिली। कोई और शब्द आज़माएँ।" }), { status: 404, headers: corsHeaders });
      }

      // टॉप 20 बेहतरीन तस्वीरें भेजना
      return new Response(JSON.stringify({ images: images.slice(0, 20) }), { headers: corsHeaders });

    } catch (error) {
      return new Response(JSON.stringify({ error: `सर्वर एरर: ${error.message}` }), { status: 500, headers: corsHeaders });
    }
  }
};
