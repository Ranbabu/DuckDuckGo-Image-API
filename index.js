export default {
  async fetch(request) {
    // CORS Headers ताकि आपका HTML इसे बिना एरर के कॉल कर सके
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
      return new Response(JSON.stringify({ error: "क्वेरी खाली है।" }), { status: 400, headers: corsHeaders });
    }

    try {
      // Bing पर सीधा सर्च (हिंदी और न्यूज़ रिज़ल्ट्स को प्राथमिकता)
      const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
      
      const response = await fetch(searchUrl, {
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept-Language": "hi-IN,hi;q=0.9,en-US;q=0.8,en;q=0.7" 
        }
      });
      
      const html = await response.text();
      let images = [];
      
      // पैटर्न 1: &quot;murl&quot;:&quot;URL&quot;
      const regex1 = /murl&quot;:&quot;(.*?)&quot;/g;
      let match;
      while ((match = regex1.exec(html)) !== null) {
        let imgUrl = match[1];
        if (imgUrl.startsWith("http") && !images.includes(imgUrl)) {
          images.push(imgUrl);
        }
      }

      // पैटर्न 2: अगर पैटर्न 1 काम न करे तो सीधा "murl":"URL" ढूँढें
      if (images.length === 0) {
        const regex2 = /"murl":"(.*?)"/g;
        while ((match = regex2.exec(html)) !== null) {
          let imgUrl = match[1];
          if (imgUrl.startsWith("http") && !images.includes(imgUrl)) {
            images.push(imgUrl);
          }
        }
      }

      // टॉप 15 इमेजेज ही भेजेंगे
      const finalImages = images.slice(0, 15);

      if (finalImages.length === 0) {
        return new Response(JSON.stringify({ error: "इस हेडलाइन से जुड़ी कोई इमेज नहीं मिली।" }), { status: 404, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ images: finalImages }), { headers: corsHeaders });
    } catch (error) {
      return new Response(JSON.stringify({ error: "सर्वर एरर: इमेज खोजने में समस्या।" }), { status: 500, headers: corsHeaders });
    }
  }
};
