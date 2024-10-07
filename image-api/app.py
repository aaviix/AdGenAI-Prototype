from fastapi import FastAPI
from diffusers import StableDiffusionPipeline

app = FastAPI()
pipe = StableDiffusionPipeline.from_pretrained("CompVis/stable-diffusion-v1-4")

@app.post("/generateImage")
async def generate_image(image_prompt: str):
    image = pipe(image_prompt).images[0]
    image.save("generated_image.png")
    return {"imageUrl": "generated_image.png"}
