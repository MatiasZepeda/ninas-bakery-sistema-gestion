import { NextRequest, NextResponse } from 'next/server';

interface ScannedItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface ScanResult {
  items: ScannedItem[];
  total: number | null;
  date: string | null;
  supplier: string | null;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a receipt/ticket scanner for a small bakery business. Extract items, prices, date, and supplier from receipt images.
Return ONLY valid JSON with this exact structure:
{
  "items": [{"name": "item name", "quantity": 1, "unit_price": 100, "total_price": 100}],
  "total": 1000,
  "date": "2026-02-11",
  "supplier": "Store Name"
}

Rules for item names — THIS IS CRITICAL:
- Extract ONLY the simple, clean product name. Remove ALL brand names, size codes, prefixes, SKU codes, and store-specific abbreviations
- Examples: "S & R Med Eggs" → "Eggs", "N Dulce de Leche" → "Dulce de Leche", "COLUN LCH ENTR 1L" → "Leche Entera", "MK Harina 000 1kg" → "Harina 000", "SOPROLE YOG GRIE" → "Yogurt Griego"
- The name should be what a normal person would call the product — short, clean, no junk
- Expand abbreviations to readable words (e.g. "HNA" → "Harina", "MNT" → "Mantequilla", "LCH" → "Leche", "AZ" → "Azúcar", "YOG" → "Yogurt")
- Use Title Case
- Do NOT use generic names like "Item 1" or "Product"

Rules for quantity and prices — THIS IS CRITICAL:
- Receipts often show quantity with the format "2 @ 1.89" meaning quantity=2, unit_price=1.89, total_price=3.78. ALWAYS parse this correctly
- Other formats: "3 x 2.50", "QTY 2 @ 1.89", etc. — extract the quantity and per-unit price
- When you see "@ price", that price is the UNIT price, not the total
- All prices should be numbers (not strings), in the receipt's currency
- quantity defaults to 1 if there is no quantity indicator
- total_price = quantity * unit_price (always calculate this)
- date format: YYYY-MM-DD (null if not found)
- supplier: the store/business name from the header of the receipt (null if not found)
- If you cannot read the receipt clearly, return {"items": [], "total": null, "date": null, "supplier": null}
- Do NOT include any text outside the JSON object`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all items, prices, date, and supplier from this receipt.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to process receipt' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 502 }
      );
    }

    // Parse the JSON from the response, handling possible markdown code blocks
    let cleaned = content.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const result: ScanResult = JSON.parse(cleaned);

    // Validate structure
    if (!Array.isArray(result.items)) {
      result.items = [];
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Receipt scan error:', error);
    return NextResponse.json(
      { error: 'Failed to scan receipt' },
      { status: 500 }
    );
  }
}
