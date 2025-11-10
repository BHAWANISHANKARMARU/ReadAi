import { Client } from '@notionhq/client';
import { NextResponse } from 'next/server';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

export async function POST(request: Request) {
  try {
    const { title, date, participants, transcript, summary } = await request.json();

    if (!transcript || !summary) {
      return NextResponse.json({ message: 'Transcript and summary are required' }, { status: 400 });
    }

    if (!databaseId) {
      throw new Error('Notion database ID is not configured');
    }

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        title: [
          {
            text: {
              content: `Meeting Summary: ${title}`,
            },
          },
        ],
        Date: {
          date: {
            start: new Date(date).toISOString(),
          },
        },
        Participants: {
          number: participants,
        },
      },
      children: [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: 'Summary' } }],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: summary } }],
          },
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: 'Transcript' } }],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: transcript } }],
          },
        },
      ],
    });

    return NextResponse.json({ notionUrl: response.url });

  } catch (error) {
    console.error('Error creating Notion page:', error);
    return NextResponse.json({ message: 'Error creating Notion page' }, { status: 500 });
  }
}
