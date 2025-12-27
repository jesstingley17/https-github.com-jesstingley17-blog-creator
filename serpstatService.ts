
import { BacklinkOpportunity, Integration, IntegrationPlatform } from './types';

export const serpstatService = {
  async getBacklinks(query: string, integration: Integration): Promise<BacklinkOpportunity[]> {
    const payload = {
      id: Math.random().toString(36).substring(7),
      method: "SerpstatBacklinksProcedure.getNewBacklinks",
      params: {
        query: query.replace('https://', '').replace('http://', '').split('/')[0],
        searchType: "domain",
        size: 10
      }
    };

    try {
      const response = await fetch(`${integration.baseUrl}?token=${integration.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      return (data.result?.data || []).map((item: any) => ({
        id: Math.random().toString(36).substring(2, 11),
        url: item.url_from,
        title: item.link_text || 'Referring Page',
        reason: `Discovered via Serpstat. Detected on ${item.first_seen}.`,
        authority: parseInt(item.domain_rank) > 40 ? 'High' : parseInt(item.domain_rank) > 20 ? 'Medium' : 'Emerging'
      }));
    } catch (e) {
      console.error("Serpstat API Error:", e);
      return [];
    }
  }
};
