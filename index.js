export default {
  async fetch(request) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    };

    // CORS प्रीफ्लाइट रिक्वेस्ट हैंडल करना
    if (request.method === "OPTIONS") return new Response(null, { headers });

    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    // अगर कोई हेडलाइन नहीं भेजी गई
    if (!query) {
      return new Response(JSON.stringify({ error: "क्वेरी खाली है। कृपया ?q=... का इस्तेमाल करें" }), { status: 400, headers });
    }

    try {
      // DuckDuckGo से असली न्यूज़ इमेजेज खोजना
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + " news photos")}`;
      
      const response = await fetch(searchUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
      });
      const html = await response.text();

      // HTML से इमेज लिंक निकालने का जुगाड़
      const imageRegex = /<img[^>]+src="([^">]+)"/g;
      let images = [];
      let match;
      
      while ((match = imageRegex.exec(html)) !== null) {
        let imgUrl = match[1];
        if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl;
        
        // फालतू लोगो या आइकन हटाने के लिए
        if (!imgUrl.includes("logo") && !imgUrl.includes("icon")) { 
          images.push(imgUrl);
        }
      }

      // टॉप 5 रियल इमेजेज का रिजल्ट वापस करें
      return new Response(JSON.stringify({ images: images.slice(0, 5) }), { headers });
    } catch (error) {
      return new Response(JSON.stringify({ error: "इमेज खोजने में समस्या आ रही है।" }), { status: 500, headers });
    }
  }
};
