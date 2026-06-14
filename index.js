export default {
  async fetch(request) {
    // CORS Headers
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
      return new Response(JSON.stringify({ error: "कृपया हेडलाइन डालें।" }), { status: 400, headers: corsHeaders });
    }

    try {
      // सीधा Google Image Search को हिट करेंगे
      const targetUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
      
      const response = await fetch(targetUrl, {
        headers: {
          // असली ब्राउज़र जैसा दिखाने के लिए Headers
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept-Language": "hi-IN,hi;q=0.9,en-US;q=0.8,en;q=0.7",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
        }
      });
      
      const html = await response.text();
      let images = [];
      
      // Google के कोड से असली हाई-क्वालिटी इमेज (jpg/png) निकालने का फॉर्मूला
      const regex = /\["(https:\/\/[^"]+?\.(?:jpg|jpeg|png|webp))",\d+,\d+\]/gi;
      let match;
      
      while ((match = regex.exec(html)) !== null) {
        let imgUrl = match[1];
        
        // Google के छोटे आइकॉन और लोगो को फ़िल्टर कर रहे हैं
        if (!imgUrl.includes('gstatic.com') && !imgUrl.includes('google.com/favicon') && !images.includes(imgUrl)) {
          images.push(imgUrl);
        }
        
        // एक बार में टॉप 20 बेहतरीन तस्वीरें लेंगे
        if (images.length >= 20) break;
      }

      if (images.length === 0) {
        return new Response(JSON.stringify({ error: "Google से इस हेडलाइन की कोई तस्वीर नहीं मिली। हेडलाइन थोड़ी छोटी करके देखें।" }), { status: 404, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ images: images }), { headers: corsHeaders });

    } catch (error) {
      return new Response(JSON.stringify({ error: "सर्वर एरर: इमेजेज लाने में दिक्कत हुई।" }), { status: 500, headers: corsHeaders });
    }
  }
};
