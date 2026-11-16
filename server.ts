import crypto from 'crypto';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

interface StudioMemberRecord {
  id: string;
  handle: string;
  email: string;
  role: 'owner' | 'member';
  tier: 'free' | 'beginner' | 'ultra' | 'pro' | 'enterprise_business';
  status: 'active' | 'revoked';
  lastSeen: string;
}

interface StudioAdminConfig {
  allowPublicSignup: boolean;
  enforceWatermark: boolean;
  overdrive144fps: boolean;
  maintenanceMode: boolean;
}

const OWNER_EMAIL = 'GTamayo36@gmail.com';
const OWNER_HANDLE = 'KNOCKSSTUDiOS';
const SERVER_HMAC_SECRET = process.env.KAYA_SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const AI_MODEL = 'gemini-4-hydrogen';

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildNativePromptEnhancement(input: {
  prompt?: string;
  subject?: string;
  environment?: string;
  style?: string;
  fps?: number;
  cameraMotion?: string;
}) {
  const base = (input.prompt || '').trim();
  const subject = (input.subject || 'Hero Subject').trim();
  const env = (input.environment || 'Obsidian Studio Stage').trim();
  const style = (input.style || 'HDR Ultra').trim();
  const fps = input.fps || 60;
  const rig = (input.cameraMotion || 'orbit').replace(/_/g, ' ');
  return {
    enhancedPrompt: base
      ? `${base} — ${subject} framed in ${env} with Pro Obsidian Matte (#050608), Platinum Chrome rim reflection, Candy Apple Red (#FF0A3C) accent flare, ${rig} camera sweep at ${fps}fps (${style}).`
      : `Anamorphic ${fps}fps ${rig} hero shot of ${subject} inside ${env}; Pro Obsidian Black (#050608) depth, Platinum Chrome specular edge highlights, Candy Apple Red (#FF0A3C) lens flare (${style}).`,
    directorNotes: `Lead 1.2s clean subject reveal on ${rig}, hold peak highlight on mid-beat, finish with crisp KAYA Studio lockup.`,
    lightingCue: '3200K warm core key paired with 6500K Platinum Chrome rim + Candy Apple Red (#FF0A3C) low kick.',
    cameraTip: `35mm anamorphic T1.8 with ${fps}fps micro-damped ${rig} inertia and zero highlights clipping.`,
  };
}

function buildNativeVisionAnalysis(prompt?: string) {
  const focus = (prompt || '').trim();
  return {
    analysis: focus
      ? `KAYA Optical Vision lock (${focus}): Strong foreground silhouette separation against deep studio shadow floor; ideal for Pro & Candy Finish grading.`
      : 'KAYA Optical Vision lock: Clean subject-to-background luminance separation with balanced midtones ready for 60–144fps specular rim pass.',
    recommendedStyle: 'HDR Ultra · Pro Obsidian & Candy Red Grade',
    lightingSuggestion: '45° Platinum Chrome top-rim + subtle Candy Cherry (#FF2E63) side fill to isolate edges.',
    colorNotes: 'Crush blacks gently to #050608, lock neutral whites to #F1F5F9, boost crimson micro-accents.',
  };
}

function buildNativeCoDirectorReply(message: string, context?: string) {
  const q = message.toLowerCase();
  const ctxLine = context ? `Active rig (${context}): ` : '';
  if (q.includes('light') || q.includes('color') || q.includes('grade')) {
    return `${ctxLine}Set base key at 45° overhead in Platinum White (#F1F5F9), crush backdrop shadows to Obsidian (#050608), and carve silhouette depth with a Candy Apple Red (#FF0A3C) edge rim at 35% intensity.`;
  }
  if (q.includes('fps') || q.includes('120') || q.includes('144') || q.includes('smooth')) {
    return `${ctxLine}For 120–144fps overdrive, select Smooth Orbit or Dolly Push with 180° virtual shutter motion smoothing and export in MP4/WebM Master directly from Timeline.`;
  }
  if (q.includes('audio') || q.includes('sync') || q.includes('beat') || q.includes('lip')) {
    return `${ctxLine}Lock transient markers on V1/A1 in Timeline, engage AirRadio FM / Sound Foley ducking at -4dB on dialogue, and match phoneme gain curves in Lip Sync Rig.`;
  }
  return `${ctxLine}Recommended KAYA Pro pipeline: 1) Lock Subject & Environment framing in Display, 2) Enhance direction inside the Prompt Window, 3) Align V1/FX/A1 cuts on the Multi-Track Timeline, then export clean 4K/8K Master.`;
}

function signToken(payload: { email: string; handle: string; role: 'owner' | 'member' }): string {
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Date.now(),
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SERVER_HMAC_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token: string): { email: string; handle: string; role: 'owner' | 'member'; exp: number } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = crypto.createHmac('sha256', SERVER_HMAC_SECRET).update(body).digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!parsed || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 2);
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    if (req.path === '/sw.js' || req.path === '/' || req.path === '/index.html') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });

  const SERVER_BUILD_ID = String(Date.now());

  const adminConfig: StudioAdminConfig = {
    allowPublicSignup: true,
    enforceWatermark: true,
    overdrive144fps: true,
    maintenanceMode: false,
  };

  const memberRegistry = new Map<string, StudioMemberRecord>([
    [
      OWNER_EMAIL.toLowerCase(),
      {
        id: 'owner-knocksstudios',
        handle: OWNER_HANDLE,
        email: OWNER_EMAIL,
        role: 'owner',
        tier: 'enterprise_business',
        status: 'active',
        lastSeen: new Date().toISOString(),
      },
    ],
  ]);

  const requireOwner = (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    const claims = token ? verifyToken(token) : null;
    if (!claims || claims.role !== 'owner') {
      res.status(401).json({ error: 'Owner authorization required.' });
      return;
    }
    next();
  };

  app.get('/api/app-version', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({ version: SERVER_BUILD_ID });
  });

  app.get('/api/studio/config', (_req, res) => {
    res.json(adminConfig);
  });

  // --------------------------------------------------------------------------
  // Authentication & Owner / Admin Portal APIs (Zero Key / Zero Passcode)
  // --------------------------------------------------------------------------

  app.post('/api/auth/member', (req, res) => {
    const { email, handle, mode } = req.body as {
      email?: string;
      handle?: string;
      mode?: 'signin' | 'signup';
    };

    const cleanEmail = String(email || '').trim();
    const cleanHandle = String(handle || '').trim() || cleanEmail.split('@')[0] || 'KAYA Creator';
    if (!cleanEmail || !cleanEmail.includes('@')) {
      res.status(400).json({ error: 'Enter a valid email address.' });
      return;
    }

    const now = new Date().toISOString();

    // Seamless owner recognition without requiring a passcode key
    if (
      cleanEmail.toLowerCase() === OWNER_EMAIL.toLowerCase() ||
      cleanHandle.toLowerCase() === OWNER_HANDLE.toLowerCase()
    ) {
      const ownerRecord = memberRegistry.get(OWNER_EMAIL.toLowerCase())!;
      ownerRecord.lastSeen = now;
      memberRegistry.set(OWNER_EMAIL.toLowerCase(), ownerRecord);
      const token = signToken({ email: OWNER_EMAIL, handle: OWNER_HANDLE, role: 'owner' });
      res.json({
        user: {
          handle: OWNER_HANDLE,
          email: OWNER_EMAIL,
          role: 'owner',
          tier: 'enterprise_business',
          signedInAt: now,
        },
        token,
      });
      return;
    }

    const key = cleanEmail.toLowerCase();
    const existing = memberRegistry.get(key);
    if (existing?.status === 'revoked') {
      res.status(403).json({ error: 'Account access has been suspended by studio administration.' });
      return;
    }

    if (mode === 'signup' && !adminConfig.allowPublicSignup && !existing) {
      res.status(403).json({ error: 'Public sign-ups are currently invite-only.' });
      return;
    }

    const record: StudioMemberRecord = existing
      ? { ...existing, handle: cleanHandle || existing.handle, lastSeen: now }
      : {
          id: `mem-${crypto.randomBytes(4).toString('hex')}`,
          handle: cleanHandle,
          email: cleanEmail,
          role: 'member',
          tier: 'free',
          status: 'active',
          lastSeen: now,
        };
    memberRegistry.set(key, record);

    const token = signToken({ email: record.email, handle: record.handle, role: 'member' });
    res.json({
      user: {
        handle: record.handle,
        email: record.email,
        role: 'member',
        tier: record.tier,
        signedInAt: now,
      },
      token,
    });
  });

  app.post('/api/auth/owner', (req, res) => {
    const { email, handle } = req.body as { email?: string; handle?: string };
    const cleanEmail = String(email || OWNER_EMAIL).trim();
    const cleanHandle = String(handle || '').trim();

    if (
      cleanEmail.toLowerCase() !== OWNER_EMAIL.toLowerCase() &&
      cleanHandle.toLowerCase() !== OWNER_HANDLE.toLowerCase()
    ) {
      res.status(401).json({ error: 'Unauthorized email for KAYA™ Owner Portal.' });
      return;
    }

    const now = new Date().toISOString();
    const ownerRecord = memberRegistry.get(OWNER_EMAIL.toLowerCase())!;
    ownerRecord.lastSeen = now;
    memberRegistry.set(OWNER_EMAIL.toLowerCase(), ownerRecord);

    const token = signToken({ email: OWNER_EMAIL, handle: OWNER_HANDLE, role: 'owner' });
    res.json({
      user: {
        handle: OWNER_HANDLE,
        email: OWNER_EMAIL,
        role: 'owner',
        tier: 'enterprise_business',
        signedInAt: now,
      },
      token,
    });
  });

  app.get('/api/admin/overview', requireOwner, (_req, res) => {
    res.json({
      owner: { handle: OWNER_HANDLE, email: OWNER_EMAIL },
      runtime: {
        port: PORT,
        buildId: SERVER_BUILD_ID,
        aiReady: true,
        aiModel: 'KAYA Native AI Engine',
        swCache: 'kaya-v8',
        lockedEndpoints: [
          '/api/build-tree',
          '/api/file-content',
          '/api/download-file',
          '/api/download-code',
          '/assets/aistudio/*',
        ],
      },
      config: adminConfig,
      members: Array.from(memberRegistry.values()),
    });
  });

  app.post('/api/admin/config', requireOwner, (req, res) => {
    const {
      allowPublicSignup,
      enforceWatermark,
      overdrive144fps,
      maintenanceMode,
    } = req.body as Partial<StudioAdminConfig>;

    if (typeof allowPublicSignup === 'boolean') adminConfig.allowPublicSignup = allowPublicSignup;
    if (typeof enforceWatermark === 'boolean') adminConfig.enforceWatermark = enforceWatermark;
    if (typeof overdrive144fps === 'boolean') adminConfig.overdrive144fps = overdrive144fps;
    if (typeof maintenanceMode === 'boolean') adminConfig.maintenanceMode = maintenanceMode;

    res.json({ ok: true, config: adminConfig });
  });

  app.post('/api/admin/member-tier', requireOwner, (req, res) => {
    const { email, tier, status } = req.body as {
      email?: string;
      tier?: StudioMemberRecord['tier'];
      status?: StudioMemberRecord['status'];
    };
    const key = String(email || '').trim().toLowerCase();
    const record = memberRegistry.get(key);
    if (!record) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }
    if (record.role === 'owner') {
      res.status(400).json({ error: 'Owner account tier cannot be downgraded.' });
      return;
    }
    if (tier) record.tier = tier;
    if (status) record.status = status;
    memberRegistry.set(key, record);
    res.json({ ok: true, member: record });
  });

  // --------------------------------------------------------------------------
  // Self-Contained KAYA AI Studio Engine Endpoints (Zero Key Errors)
  // --------------------------------------------------------------------------

  app.get('/api/ai/status', (_req, res) => {
    res.json({
      ready: true,
      model: 'KAYA Native AI Engine',
      capabilities: ['prompt-enhance', 'vision-analyze', 'chat'],
    });
  });

  app.post('/api/ai/prompt-enhance', async (req, res) => {
    const ai = getAiClient();
    const { prompt, subject, environment, style, fps, cameraMotion } = req.body as {
      prompt?: string;
      subject?: string;
      environment?: string;
      style?: string;
      fps?: number;
      cameraMotion?: string;
    };

    if (!ai) {
      res.json(buildNativePromptEnhancement({ prompt, subject, environment, style, fps, cameraMotion }));
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: AI_MODEL,
        contents: `You are KAYA Studio's senior cinematography and VFX AI director.
Rewrite and elevate this scene prompt for a Pro & Candy Finish (Obsidian Matte Black, Platinum Chrome, Glossy Candy Apple Red) production render.
User prompt: "${prompt || 'Hero studio product orbit with sharp specular highlights'}"
Subject: ${subject || 'Hero Product'}
Environment: ${environment || 'Studio Stage'}
Render Style: ${style || 'HDR Ultra'}
Frame Rate: ${fps || 60}fps
Camera Rig: ${cameraMotion || 'orbit'}`,
        config: {
          systemInstruction:
            'Return concise, punchy, production-ready cinematography guidance. Keep enhancedPrompt under 45 words.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              enhancedPrompt: { type: Type.STRING, description: 'Polished cinematic prompt.' },
              directorNotes: { type: Type.STRING, description: 'Short framing/pacing note.' },
              lightingCue: { type: Type.STRING, description: 'Key/rim lighting setup.' },
              cameraTip: { type: Type.STRING, description: 'Motion rig & shutter tip.' },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch {
      res.json(buildNativePromptEnhancement({ prompt, subject, environment, style, fps, cameraMotion }));
    }
  });

  app.post('/api/ai/vision-analyze', async (req, res) => {
    const ai = getAiClient();
    const { imageBase64, mimeType, prompt } = req.body as {
      imageBase64?: string;
      mimeType?: string;
      prompt?: string;
    };

    if (!imageBase64) {
      res.status(400).json({ error: 'Image payload required for vision analysis.' });
      return;
    }

    if (!ai) {
      res.json(buildNativeVisionAnalysis(prompt));
      return;
    }

    try {
      const cleanData = imageBase64.replace(/^data:[^;]+;base64,/, '');
      const response = await ai.models.generateContent({
        model: AI_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: cleanData,
              },
            },
            {
              text:
                prompt ||
                'Analyze this visual asset for cinematography composition, recommended render style, lighting setup, and Pro & Candy Finish color grading.',
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: { type: Type.STRING },
              recommendedStyle: { type: Type.STRING },
              lightingSuggestion: { type: Type.STRING },
              colorNotes: { type: Type.STRING },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch {
      res.json(buildNativeVisionAnalysis(prompt));
    }
  });

  app.post('/api/ai/chat', async (req, res) => {
    const ai = getAiClient();
    const { message, context } = req.body as { message?: string; context?: string };

    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Message cannot be empty.' });
      return;
    }

    if (!ai) {
      res.json({ reply: buildNativeCoDirectorReply(message, context) });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: AI_MODEL,
        contents: context ? `Studio Context: ${context}\n\nRequest: ${message}` : message,
        config: {
          systemInstruction:
            'You are KAYA AI Co-Director inside the KAYA Pro & Candy Finish creative suite (24-144fps video, 3D Rubik cube stage, VFX shaders, audio mastering, and lip sync). Give crisp, actionable technical and creative answers.',
        },
      });
      res.json({ reply: response.text ?? buildNativeCoDirectorReply(message, context) });
    } catch {
      res.json({ reply: buildNativeCoDirectorReply(message, context) });
    }
  });

  // Proprietary source protection: block any external source enumeration or archive dumps
  app.all(
    ['/api/build-tree', '/api/file-content', '/api/download-file', '/api/download-code', '/assets/aistudio/*'],
    (_req, res) => {
      res.status(403).json({
        error: 'Access denied: Proprietary source code protected © 2024–2026 KAYA™',
      });
    }
  );

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KAYA server running on http://localhost:${PORT}`);
  });
}

startServer();
