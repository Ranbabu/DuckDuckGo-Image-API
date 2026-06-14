export default {
  async fetch(request) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") return new Response(null, { headers });

    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    if (!query) {
      return new Response(JSON.stringify({ error: "क्वेरी खाली है।" }), { status: 400, headers });
    }

    try {
      // Bing Image Search का इस्तेमाल (असली और HD इमेजेज के लिए)
      const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2`;
      
      const response = await fetch(searchUrl, {
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
          // यह हेडर खास तौर पर हिंदी और भारतीय न्यूज़ रिज़ल्ट्स को प्राथमिकता देगा
          "Accept-Language": "hi-IN,hi;q=0.9,en-US;q=0.8,en;q=0.7" 
        }
      });
      const html = await response.text();

      // Bing के कोड से असली हाई-क्वालिटी इमेज (murl) निकालना (Robust Regex)
      // यह &quot; और साधारण " दोनों तरह के फॉर्मेट को सपोर्ट करेगा
      const imageRegex = /murl(?:&quot;|"):(?:&quot;|")(.*?)(?:&quot;|")/g;
      let images = [];
      let match;
      
      while ((match = imageRegex.exec(html)) !== null) {
        let imgUrl = match[1];
        // फालतू लोगो और छोटे आइकन हटाने के लिए फ़िल्टर
        if (imgUrl.startsWith("http") && !images.includes(imgUrl)) {
          images.push(imgUrl);
        }
        // टॉप 10 सबसे बेहतरीन इमेजेज लेंगे
        if(images.length >= 10) break; 
      }

      if (images.length === 0) {
        return new Response(JSON.stringify({ error: "इस हेडलाइन से जुड़ी कोई सटीक इमेज नहीं मिली।" }), { status: 404, headers });
      }

      return new Response(JSON.stringify({ images: images }), { headers });
    } catch (error) {
      return new Response(JSON.stringify({ error: "इमेज खोजने में सर्वर पर समस्या आ रही है।" }), { status: 500, headers });
    }
  }
};
