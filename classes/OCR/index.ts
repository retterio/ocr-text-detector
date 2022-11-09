import RDK, { Data, InitResponse, Response, StepResponse } from "@retter/rdk"
import Tesseract from 'tesseract.js';
import path from 'path'

const rdk = new RDK()

export async function authorizer(data: Data): Promise<Response> {  
  if (data.context.instanceId) {
    return {
      statusCode: 403,
      body: 'Only static calls are allowed'
    }
  }
  return { statusCode: 200 }
}

export async function init(data: Data): Promise<InitResponse> {
  return { state: { public: {}, private: {} } }
}

export async function getState(data: Data): Promise<Response> {
  return { statusCode: 400, body: data.state }
}

// should not create instances
export async function getInstanceId(data: Data): Promise<string> {
  return 'default'
}

// This function has a parameter that is the images base64 string.
// Tesseract can use base64 to decode text.
const processPhoto = async (encodedImage: string) => {
  // Using Tesseract to get text from image
  const worker = Tesseract.createWorker({
    cachePath: path.join('/tmp'),
  });
  await worker.load();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');

  // data is part of Tesseract library and keeps the processed image data
  const { data: { text } } = await worker.recognize(encodedImage);
  await worker.terminate();
  return text
}

// Function that will be called by client.
export async function extractText(data: Data): Promise<StepResponse> {
  try {
    // image64 iS image but its in base64 format
    const { image64 } = data.request.body;

    if (!image64) throw new Error("Image is null!");

    // Text from the image
    const imageText = await processPhoto(image64);

    // Function response parameters
    data.response = {
      statusCode: 200,
      body: { success: true, text: imageText },
    }
  } catch (e) {
    data.response = {
      statusCode: 404,
      body: { succes: false, error: e },
    }
  }

  return data
}