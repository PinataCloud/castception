import { Router } from 'itty-router';
import { PinataFDK } from "pinata-fdk";

const router = Router();

router.post('/api/castception', async (request, env) => {
	const fdk = new PinataFDK({
		pinata_jwt: env.PINATA_JWT,
		pinata_gateway: env.PINATA_GATEWAY
	},
	);

	const content = await request.json();

	const { isValid, message } = await fdk.validateFrameMessage(content);

	if (!isValid) {
		return new Response("Unauthorized");
	}

	if (!message) {
		return new Response("No message");
	}

	const buttonClicked = message.data?.frameActionBody?.buttonIndex

	//	Check if signer is connected and approved or fid
	const signerRes = await fetch(`https://api.pinata.cloud/v3/farcaster/signers?fid=${message?.data?.fid}`, {
		method: "GET",
		headers: {
			'Authorization': `Bearer ${env.PINATA_JWT}`
		}
	})
	const signerDetails: any = await signerRes.json()
	const signers = signerDetails.data.signers

	let alreadyApproved = false;
	let approved;
	if (signers.length > 0) {
		approved = signers.find((s: any) => s.signer_approved === true);		
		if (approved) {
			alreadyApproved = true;
		}
	}

	if (!alreadyApproved) {
		const fcRes = await fetch(`https://api.pinata.cloud/v3/farcaster/sponsored_signers`, {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${env.PINATA_JWT}`
			},
			body: JSON.stringify({
				app_fid: 4823
			})
		})
		const data: any = await fcRes.json()

		const frameMetadata = fdk.getFrameMetadata({
			post_url: `https://castception.pinatadrops.com/api/castception/status?redirectUrl=${data.data.deep_link_url}&token=${data.data.token}`,
			aspect_ratio: "1:1",
			buttons: [
				{ label: 'Check approval status', action: 'post' },
				{ label: 'Approve in Warpcast', action: "link", target: `https://castception.pinatadrops.com/approve?redirectUrl=${data.data.deep_link_url}` }, 
				{ label: 'Learn more', action: "link", target: "https://pinata.cloud/blog"}
			],
			state: { token: data.data.token },
			cid: "Qmcp2GUFfJfNxZu9T5H7CFBeVKLzv4uSqwnBPhj8ANFPoE",
		});

		const frameRes =
			`<!DOCTYPE html>
		<html>
			<head>
				<title>Castception</title>
				<meta property="fc:frame" content="vNext" />
				<meta property="og:title" content="Castception" />
				<meta property="og:description" content="Castception" />
				${frameMetadata}
			</head>
			<body>
				<img style="width: 600px; height: 600px;" src="${env.PINATA_GATEWAY}/ipfs/Qmbs3NXdzcqopAuAkj9jCn271X9aNbMcVQjeQEARdsGhaQ" />
			</body>
		</html>`;

		return new Response(frameRes, { headers: { 'Content-Type': 'text/html' } })
	} 

	if (buttonClicked === 1 && message.data?.frameActionBody?.inputText) {	
		//	Get username
		const usernameRes = await fetch(`https://api.pinata.cloud/v3/farcaster/users/${message?.data?.fid}`, {
			headers: {
				'Authorization': `Bearer ${env.PINATA_JWT}`
			}
		})	
		const user: any = await usernameRes.json()
		const username = user?.data?.username

		//	Send cast
		const signerId = approved?.signer_uuid
		const castRes = await fetch(`https://api.pinata.cloud/v3/farcaster/casts`, {
			method: "POST", 
			headers: {
				'Content-Type': 'application/json', 
				'Authorization': `Bearer ${env.PINATA_JWT}`
			}, 
			body: JSON.stringify({
				castAddBody: {
					embeds: [
						{
							castId: {
								fid: content?.untrustedData?.castId?.fid, 
								hash: content?.untrustedData?.castId?.hash
							}							
						}, {
							url: "https://castception.pinatadrops.com/api/castception"
						}
					], 
					text: content?.untrustedData?.inputText
				}, 
				signerId
			})
		})

		const cast: any = await castRes.json();

		const warpcastUrl = `https://warpcast.com/${username}/${cast?.data?.hash.slice(0, 10)}`
		const frameMetadata = fdk.getFrameMetadata({
			post_url: `https://castception.pinatadrops.com/api/castception`,
			aspect_ratio: "1:1",
			buttons: [
				{ label: 'View cast', action: 'link', target: warpcastUrl },
				{ label: 'Learn more', action: "link", target: "https://pinata.cloud/blog"}
			],
			cid: "QmUq5kHXuZXkvUohVLTuzBw7kKT8RWMVV16X78mpFDyQLi",
		});

		const frameRes =
			`<!DOCTYPE html><html><head>
								<title>Castception</title>
								<meta property="fc:frame" content="vNext" />
								<meta property="og:title" content="Castception" />
								<meta property="og:description" content="Castception" />
								${frameMetadata}
								</head><body><img style="width: 600px; height: 600px;" src="${env.PINATA_GATEWAY}/ipfs/Qmbs3NXdzcqopAuAkj9jCn271X9aNbMcVQjeQEARdsGhaQ" /></body></html>`;
		return new Response(frameRes, { headers: { 'Content-Type': 'text/html' } })
	} else {
		const frameMetadata = fdk.getFrameMetadata({
			post_url: `https://castception.pinatadrops.com/api/castception`,
			input: { text: "Send your cast" },
			aspect_ratio: "1:1",
			buttons: [
				{ label: 'Send cast', action: 'post' },
				{ label: 'Connect with Warpcast', action: "post" },
				{ label: 'Learn more', action: "link", target: "https://pinata.cloud/blog"}
			],
			cid: "QmNMTDjXisTyWERGCipzg1ieViLgbdnji8FYjkNxpwckVz",
		});

		const frameRes =
			`<!DOCTYPE html><html><head>
								<title>Castception</title>
								<meta property="fc:frame" content="vNext" />
								<meta property="og:title" content="Castception" />
								<meta property="og:description" content="Castception" />
								${frameMetadata}
								</head><body><img style="width: 600px; height: 600px;" src="${env.PINATA_GATEWAY}/ipfs/Qmbs3NXdzcqopAuAkj9jCn271X9aNbMcVQjeQEARdsGhaQ" /></body></html>`;
		return new Response(frameRes, { headers: { 'Content-Type': 'text/html' } })

	}
});

router.post('/api/castception/status', async (request, env) => {
	const fdk = new PinataFDK({
		pinata_jwt: env.PINATA_JWT,
		pinata_gateway: env.PINATA_GATEWAY
	});

	const url = new URL(request.url);
	const redirectUrl = url.searchParams.get('redirectUrl');
	const token = url.searchParams.get('token');

	const content = await request.json();
	const { isValid, message } = await fdk.validateFrameMessage(content);

	if (!isValid) {
		return new Response("Unauthorized");
	}

	if (!message) {
		return new Response("No message");
	}

	const buttonClicked = message.data?.frameActionBody?.buttonIndex
	if (buttonClicked === 1) {
		const approvalResponse = await fetch(`https://api.pinata.cloud/v3/farcaster/poll_warpcast_signer?token=${token}`, {
			method: "POST",
			headers: {
				'Authorization': `Bearer ${env.PINATA_JWT}`
			},
			body: null
		})

		const status: any = await approvalResponse.json()

		if (status?.data?.result?.signedKeyRequest?.state === "completed") {
			const frameMetadata = fdk.getFrameMetadata({
				post_url: `https://castception.pinatadrops.com/api/castception`,
				input: { text: "Send your cast" },
				aspect_ratio: "1:1",
				buttons: [
					{ label: 'Send cast', action: 'post' },
					{ label: 'Learn more', action: "link", target: "https://pinata.cloud/blog"}
				],
				cid: "QmNMTDjXisTyWERGCipzg1ieViLgbdnji8FYjkNxpwckVz",
			});

			const frameRes =
				`<!DOCTYPE html><html><head>
								<title>Castception</title>
								<meta property="fc:frame" content="vNext" />
								<meta property="og:title" content="Castception" />
								<meta property="og:description" content="Castception" />
								${frameMetadata}
								</head><body><img style="width: 600px; height: 600px;" src="${env.PINATA_GATEWAY}/ipfs/Qmbs3NXdzcqopAuAkj9jCn271X9aNbMcVQjeQEARdsGhaQ" /></body></html>`;
			return new Response(frameRes, { headers: { 'Content-Type': 'text/html' } })
		} else {
			const frameMetadata = fdk.getFrameMetadata({
				post_url: `https://castception.pinatadrops.com/api/castception/status?redirectUrl=${redirectUrl}&token=${token}`,
				aspect_ratio: "1:1",
				buttons: [
					{ label: 'Check approval status', action: 'post' },
					{ label: 'Approve in Warpcast', action: "link", target: `https://castception.pinatadrops.com/approve?redirectUrl=${redirectUrl}` }
				],
				state: { token: message?.data?.frameActionBody?.state },
				cid: "QmXE632TCnfSfxyfTcLNZRJ7265rw1iXpJQxAvfA2yG1hD",
			});

			const frameRes =
				`<!DOCTYPE html>
			<html>
				<head>
					<title>Castception</title>
					<meta property="fc:frame" content="vNext" />
					<meta property="og:title" content="Castception" />
					<meta property="og:description" content="Castception" />
					${frameMetadata}
				</head>
				<body>
					<img style="width: 600px; height: 600px;" src="${env.PINATA_GATEWAY}/ipfs/Qmbs3NXdzcqopAuAkj9jCn271X9aNbMcVQjeQEARdsGhaQ" />
				</body>
			</html>`;

			return new Response(frameRes, { headers: { 'Content-Type': 'text/html' } })
		}
	}

	return new Response("");
});

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default router;
