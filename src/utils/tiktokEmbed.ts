/**
 * Parse TikTok URL to extract username and video ID
 */
export const getTikTokEmbedProps = (tiktokUrl: string) => {
  if (!tiktokUrl) return null;
  
  // Match pattern: @username/video/videoId
  const match = tiktokUrl.match(/@([^/]+)\/video\/(\d+)/);
  if (!match) return null;
  
  const [, username, videoId] = match;
  return { username, videoId };
};

/**
 * Generate TikTok embed HTML blockquote
 */
export const generateTikTokEmbedHTML = (
  tiktokUrl: string,
  caption?: string,
  username?: string
) => {
  const props = getTikTokEmbedProps(tiktokUrl);
  if (!props) return null;

  const { username: parsedUsername, videoId } = props;
  const displayUsername = username || parsedUsername;
  const displayCaption = caption || 'TikTok video';

  return `
    <blockquote 
      class="tiktok-embed" 
      cite="${tiktokUrl}" 
      data-video-id="${videoId}" 
      style="max-width: 605px; min-width: 325px;"
    >
      <section>
        <a 
          target="_blank" 
          title="@${displayUsername}" 
          href="https://www.tiktok.com/@${displayUsername}?refer=embed"
        >
          @${displayUsername}
        </a>
        <p>${displayCaption}</p>
        <a 
          target="_blank" 
          title="♬ original sound" 
          href="https://www.tiktok.com/music/original-sound?refer=embed"
        >
          ♬ original sound
        </a>
      </section>
    </blockquote>
  `.trim();
};
