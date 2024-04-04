import qr from 'qr-image'

async function generateQRCode(request: any) {
	const { text } = await request.json()
	const headers = { "Content-Type": "image/png" }
	const qr_png = qr.imageSync(text || "https://workers.dev")

	return new Response(qr_png, { headers });
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'POST') {
			return generateQRCode(request)
		}
		const url = new URL(request.url);
		const redirectUrl = url.searchParams.get('redirectUrl'); // get a query param value (?redirectUrl=...)

		if (!redirectUrl) {
			return new Response('Bad request: Missing `redirectUrl` query param', { status: 400 });
		}

    return new Response(`
    <!DOCTYPE html>
		<html>
			<head>
				<title>Castception</title>
				<meta property="fc:frame" content="vNext" />
				<meta property="og:title" content="Castception" />
				<meta property="og:description" content="Castception" />
      </head>
      <body style="min-width: 100vw; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <h1>Castception</h1>
      <p>Use the QR code below if on desktop. Otherwise, click the link.</p>      
      <img id="qr" src="#" />
      <p>If on mobile, click this link to approve in Waprcast</p>
      <a href="${redirectUrl}">Approve in Warpcast</a>
      <script>      
        document.addEventListener("DOMContentLoaded", function() {
          console.log("Loaded")
          
          function generate() {
            console.log("Generating")
            fetch("https://castception.pinata-marketing-enterprise.workers.dev/approve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: "${redirectUrl}" })
            })
            .then(response => response.blob())
            .then(blob => {
              const reader = new FileReader();
              reader.onloadend = function () {
                document.querySelector("#qr").src = reader.result; // Update the image source with the newly generated QR code
              }
              reader.readAsDataURL(blob);
            })
          }     
          generate()
        });
      </script>
      </body>
    `, {
			headers: {
				"Content-Type": "text/html"
			}
		})
	},
};