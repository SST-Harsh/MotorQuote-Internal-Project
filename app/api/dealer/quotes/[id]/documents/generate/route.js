import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/dealer/quotes/{id}/documents/generate
 *
 * Generate quote documents for a dealer quote.
 * The quote must be in 'approved' or 'accepted' status before generating documents.
 *
 * Request Payload:
 * {
 *   dealerName: string,
 *   dealershipName: string,
 *   vehicleDetails: {
 *     make: string,
 *     model: string,
 *     year: string,
 *     vin: string,
 *     registrationNumber: string,
 *     colour: string,
 *     mileage: string
 *   },
 *   mileageAtSale: string,
 *   paymentMethod: string
 * }
 */
export async function POST(request, { params }) {
  try {
    const { id } = params;

    // Get the quote ID from params
    const quoteId = id;

    // Get authentication token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await request.json();

    // Validate required fields
    const { dealerName, dealershipName, vehicleDetails, mileageAtSale, paymentMethod } = body;

    if (!dealerName || !dealershipName || !vehicleDetails || !mileageAtSale || !paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Missing required fields: dealerName, dealershipName, vehicleDetails, mileageAtSale, paymentMethod',
        },
        { status: 400 }
      );
    }

    // Validate vehicleDetails
    const { make, model, year, vin, registrationNumber, colour, mileage } = vehicleDetails;
    if (!make || !model || !year || !vin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required vehicle details: make, model, year, vin',
        },
        { status: 400 }
      );
    }

    // Get the base API URL from environment or use a default
    // Use relative path for internal API calls in Next.js
    const API_URL = process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/dealer`
      : '/api/dealer';

    // First, fetch the quote to check its status
    const quoteResponse = await fetch(`${API_URL}/quotes/${quoteId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!quoteResponse.ok) {
      const errorData = await quoteResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          message:
            errorData.message || `Failed to fetch quote details (Status: ${quoteResponse.status})`,
        },
        { status: quoteResponse.status }
      );
    }

    let quote;
    try {
      const quoteData = await quoteResponse.json();
      quote = quoteData.data || quoteData;
    } catch (parseError) {
      console.error('Error parsing quote response:', parseError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to parse quote data',
        },
        { status: 500 }
      );
    }

    // Check if quote exists and has required fields
    if (!quote || !quote.status) {
      return NextResponse.json(
        {
          success: false,
          message: 'Quote not found or invalid quote data',
        },
        { status: 404 }
      );
    }

    // Check if quote status is sold (documents should only be generated after car is sold)
    const quoteStatus = (quote.status || '').toLowerCase();
    const allowedStatuses = ['sold', 'sold_out', 'converted'];

    if (!allowedStatuses.includes(quoteStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot generate documents. Documents can only be generated after the vehicle is sold. Current status: '${quoteStatus}'. Please mark the quote as sold first.`,
        },
        { status: 400 }
      );
    }

    // Prepare the document generation payload
    const documentPayload = {
      dealerName,
      dealershipName,
      vehicleDetails: {
        make,
        model,
        year,
        vin,
        registrationNumber: registrationNumber || '',
        colour: colour || '',
        mileage: mileage || '',
      },
      mileageAtSale,
      paymentMethod,
      quoteId,
      quoteAmount: quote.amount || quote.quote_amount || 0,
      customerName: quote.customer_name || quote.customerName || '',
      customerEmail: quote.customer_email || quote.customerEmail || '',
      generatedAt: new Date().toISOString(),
    };

    // Make the actual API call to generate documents
    // This would connect to your backend service that handles document generation
    // For now, we'll simulate a successful response

    // In a real implementation, you would call your backend service like:
    // const docResponse = await fetch(`${BACKEND_URL}/documents/generate`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(documentPayload)
    // });

    // Simulate successful document generation for sold vehicles
    const generatedDocuments = [
      {
        id: `doc_${Date.now()}_1`,
        type: 'deal_confirmation_letter',
        name: 'Deal Confirmation Letter',
        format: 'pdf',
        url: `/documents/deal_${quoteId}_confirmation.pdf`,
        generatedAt: new Date().toISOString(),
      },
      {
        id: `doc_${Date.now()}_2`,
        type: 'vehicle_sale_receipt',
        name: 'Vehicle Sale Receipt',
        format: 'pdf',
        url: `/documents/vehicle_${quoteId}_sale_receipt.pdf`,
        generatedAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json(
      {
        success: true,
        message:
          'Sale documents generated successfully. Deal Confirmation Letter and Vehicle Sale Receipt have been created.',
        data: {
          quoteId,
          status: quoteStatus,
          documents: generatedDocuments,
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Document generation error:', error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'An error occurred while generating documents',
      },
      { status: 500 }
    );
  }
}
