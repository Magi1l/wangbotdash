import { Express } from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { storage } from './storage';

export function setupAuth(app: Express) {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Discord OAuth routes
  app.get('/auth/discord', (req, res) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const host = req.get('host');
    const protocol = req.protocol;
    
    console.log('OAuth Request Info:', {
      host,
      protocol,
      fullUrl: `${protocol}://${host}`
    });
    
    // Railway 배포 환경에서는 고정 URI 사용
    let redirectUri;
    if (host?.includes('railway.app') || host?.includes('up.railway.app')) {
      redirectUri = encodeURIComponent('https://wangbotdash.up.railway.app/auth/discord/callback');
    } else {
      redirectUri = encodeURIComponent(`${protocol}://${host}/auth/discord/callback`);
    }
    const scope = encodeURIComponent('identify guilds');
    const responseType = 'code';
    
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;
    
    console.log('Generated Auth URL:', discordAuthUrl);
    console.log('Redirect URI:', `${protocol}://${host}/auth/discord/callback`);
    
    res.redirect(discordAuthUrl);
  });

  app.get('/auth/discord/callback', async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect('/login?error=no_code');
    }

    try {
      const host = req.get('host');
      
      // Railway 환경에서는 고정 URI 사용
      let callbackUri;
      if (host?.includes('railway.app') || host?.includes('up.railway.app')) {
        callbackUri = 'https://wangbotdash.up.railway.app/auth/discord/callback';
      } else {
        callbackUri = `${req.protocol}://${host}/auth/discord/callback`;
      }
      
      console.log('Token exchange - using callback URI:', callbackUri);
      
      // Exchange code for access token
      const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID!,
          client_secret: process.env.DISCORD_CLIENT_SECRET!,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: callbackUri,
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        console.error('Token exchange failed:', tokenData);
        return res.redirect('/login?error=token_exchange_failed');
      }

      // Get user info
      const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': `WangBot Dashboard (${req.protocol}://${req.get('host')}, 1.0.0)`,
        },
      });

      if (!userResponse.ok) {
        console.error('User fetch failed:', userResponse.status, await userResponse.text());
        return res.redirect('/login?error=user_fetch_failed');
      }

      const userData = await userResponse.json();

      // Get user guilds
      const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': `WangBot Dashboard (${req.protocol}://${req.get('host')}, 1.0.0)`,
        },
      });

      if (!guildsResponse.ok) {
        console.error('Guilds fetch failed:', guildsResponse.status, await guildsResponse.text());
        return res.redirect('/login?error=guilds_fetch_failed');
      }

      const guildsData = await guildsResponse.json();
      console.log('OAuth: Fetched', guildsData?.length || 0, 'guilds for user', userData.username);

      // Store user in database
      const user = {
        id: userData.id,
        username: userData.username,
        discriminator: userData.discriminator || '0000',
        avatar: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : null
      };

      await storage.createUser(user);

      // Store user info in session
      (req.session as any).user = {
        ...user,
        accessToken: tokenData.access_token,
        guilds: guildsData
      };

      res.redirect('/servers');
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/login?error=oauth_failed');
    }
  });

  app.get('/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction failed:', err);
      }
      res.redirect('/');
    });
  });

  app.get('/auth/me', (req, res) => {
    const user = (req.session as any)?.user;
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });
}

// Middleware to check if user is authenticated
export function requireAuth(req: any, res: any, next: any) {
  const user = (req.session as any)?.user;
  if (user) {
    req.user = user;
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
}

// Middleware to check if user is admin of the server
export async function requireServerAdmin(req: any, res: any, next: any) {
  const user = (req.session as any)?.user;
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const serverId = req.params.serverId;
  const userId = user.id;

  try {
    // Check if user is admin/owner of the server from cached guild data
    const userGuilds = user.guilds || [];
    const guild = userGuilds.find((g: any) => g.id === serverId);
    
    if (!guild) {
      return res.status(403).json({ message: 'Server access required' });
    }

    // Check if user has admin permissions (permission bit 8 = ADMINISTRATOR)
    const hasAdminPermissions = (guild.permissions & 0x8) === 0x8 || guild.owner;
    
    if (!hasAdminPermissions) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (error) {
    res.status(403).json({ message: 'Admin access required' });
  }
}

// Middleware to check if user has any access to server (admin or bot present)
export async function requireServerAccess(req: any, res: any, next: any) {
  const user = (req.session as any)?.user;
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const serverId = req.params.serverId;

  try {
    // Check if bot is in the server
    const botGuildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        'User-Agent': 'WangBot Dashboard (https://wangbotdash.up.railway.app, 1.0.0)',
      },
    });

    const userGuilds = user.guilds || [];
    const userGuild = userGuilds.find((g: any) => g.id === serverId);
    
    let hasBotAccess = false;
    if (botGuildsResponse.ok) {
      const botGuilds = await botGuildsResponse.json();
      hasBotAccess = botGuilds.some((g: any) => g.id === serverId);
    }

    const hasAdminPermissions = userGuild && ((userGuild.permissions & 0x8) === 0x8 || userGuild.owner);

    // Allow access if user has admin permissions OR bot is in the server
    if (!hasAdminPermissions && !hasBotAccess) {
      return res.status(403).json({ message: "No access to this server" });
    }

    // Store permission info for routes to use
    req.serverAccess = {
      hasAdminPermissions,
      hasBotAccess,
      isUserInServer: !!userGuild
    };

    next();
  } catch (error) {
    console.error('Error checking server access:', error);
    res.status(500).json({ message: "Failed to verify server access" });
  }
}