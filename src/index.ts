import handleApprove from './approve';
import apiRouter from './router';
import { PinataFDK } from "pinata-fdk";

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {		
		const fdk = new PinataFDK({
			pinata_jwt: env.PINATA_JWT,
			pinata_gateway: env.PINATA_GATEWAY
		});
		const url = new URL(request.url);

		switch (url.pathname) {
			case '/approve': 
				return handleApprove.fetch(request, env, ctx);
		}

		if (url.pathname.startsWith('/api/')) {
			return apiRouter.handle(request, env);
		}

		const frameMetadata = fdk.getFrameMetadata({
			post_url: `https://castception.pinatadrops.com/api/castception`,
			input: { text: "Send your cast" },
			aspect_ratio: "1:1",
			buttons: [
				{ label: 'Send cast', action: 'post' },
				{ label: 'Connect to Warpcast', action: "post" },
				{ label: 'Learn more', action: "link", target: "https://www.pinata.cloud/blog/how-to-send-casts-in-a-farcaster-frame"}
			],
			cid: "Qmbs3NXdzcqopAuAkj9jCn271X9aNbMcVQjeQEARdsGhaQ",
		});
	
		const frameRes =
			`<!DOCTYPE html><html><head>
							<title>Castception</title>
							<meta property="fc:frame" content="vNext" />
							<meta property="og:title" content="Castception" />
							<meta property="og:description" content="Castception" />
							${frameMetadata}
							</head><body>
							<img style="width: 600px; height: 600px;" src="${env.PINATA_GATEWAY}/ipfs/Qmbs3NXdzcqopAuAkj9jCn271X9aNbMcVQjeQEARdsGhaQ" />
							<a href="https://warpcast.com/~/channel/pinata">Follow Pinata on Warpcast</a>
							</body></html>`;

		return new Response(frameRes,
			{ headers: { 'Content-Type': 'text/html' } }
		);
	},
};
