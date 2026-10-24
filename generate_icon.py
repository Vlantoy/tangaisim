import os
import math
from PIL import Image, ImageDraw, ImageFilter

def create_bumble_icon():
    # Render at 1024x1024 for supersampling antialiasing
    S = 1024
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Base squircle (rounded rectangle)
    margin = 48
    r = 230
    box = [margin, margin, S - margin, S - margin]

    # Create gradient background
    grad = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    grad_draw = ImageDraw.Draw(grad)
    for y in range(margin, S - margin):
        # Vertical gradient from bright bumble yellow to warm amber yellow
        t = (y - margin) / float(S - 2 * margin)
        # Top: #FFE259 (255, 226, 89) -> Bottom: #FFA700 (255, 167, 0)
        cr = int(255)
        cg = int(226 * (1 - t) + 167 * t)
        cb = int(89 * (1 - t) + 5 * t)
        grad_draw.line([(margin, y), (S - margin, y)], fill=(cr, cg, cb, 255))

    # Mask for squircle
    mask = Image.new("L", (S, S), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(box, radius=r, fill=255)

    # Subtle ambient inner rim
    inner_mask = Image.new("L", (S, S), 0)
    inner_draw = ImageDraw.Draw(inner_mask)
    inner_box = [margin + 8, margin + 8, S - margin - 8, S - margin - 8]
    inner_draw.rounded_rectangle(inner_box, radius=r - 6, fill=255)

    # Composite squircle
    squircle = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    squircle.paste(grad, (0, 0), mask)

    # Soft ambient drop shadow under the squircle
    shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_box = [margin, margin + 24, S - margin, S - margin + 24]
    shadow_draw.rounded_rectangle(shadow_box, radius=r, fill=(0, 0, 0, 90))
    shadow = shadow.filter(ImageFilter.GaussianBlur(32))

    # Combine shadow + squircle
    final_img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    final_img.paste(shadow, (0, 0), shadow)
    final_img.paste(squircle, (0, 0), squircle)

    # 2. Main Speech Bubble in Center (Dark Charcoal #12141A)
    # Speech bubble shape
    bubble_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    b_draw = ImageDraw.Draw(bubble_layer)

    # Bubble bounds
    bw = 640
    bh = 510
    bx0 = (S - bw) // 2
    by0 = 230
    bx1 = bx0 + bw
    by1 = by0 + bh
    bubble_radius = 160

    # Draw bubble tail pointing bottom-left
    tail_pts = [
        (bx0 + 100, by1 - 40),
        (bx0 + 40, by1 + 90),
        (bx0 + 220, by1 - 10)
    ]
    b_draw.polygon(tail_pts, fill=(18, 20, 26, 255))
    b_draw.rounded_rectangle([bx0, by0, bx1, by1], radius=bubble_radius, fill=(18, 20, 26, 255))

    # Add soft bubble shadow
    b_shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    bs_draw = ImageDraw.Draw(b_shadow)
    bs_draw.polygon([(p[0], p[1] + 16) for p in tail_pts], fill=(0, 0, 0, 60))
    bs_draw.rounded_rectangle([bx0, by0 + 16, bx1, by1 + 16], radius=bubble_radius, fill=(0, 0, 0, 60))
    b_shadow = b_shadow.filter(ImageFilter.GaussianBlur(20))

    final_img.paste(b_shadow, (0, 0), b_shadow)
    final_img.paste(bubble_layer, (0, 0), bubble_layer)

    # 3. Inside the Bubble: Iconic Bumble Beehive Stripes (#FFD233)
    stripes_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(stripes_layer)

    yellow_color = (255, 215, 51, 255)
    stripe_h = 42
    cy = by0 + 140

    # 4 Iconic horizontal beehive stripes with curved pill caps
    stripes = [
        (250, cy - 80),   # Top stripe
        (380, cy),        # 2nd stripe (longest)
        (320, cy + 80),   # 3rd stripe
        (190, cy + 160)   # 4th stripe (bottom)
    ]

    for width, sy in stripes:
        sx0 = (S - width) // 2
        sx1 = sx0 + width
        sy0 = sy - stripe_h // 2
        sy1 = sy + stripe_h // 2
        s_draw.rounded_rectangle([sx0, sy0, sx1, sy1], radius=stripe_h // 2, fill=yellow_color)

    # Cute glowing dot / spark in top right of speech bubble
    dot_r = 18
    dot_cx = bx1 - 110
    dot_cy = by0 + 95
    s_draw.ellipse([dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r], fill=(255, 245, 170, 255))

    final_img.paste(stripes_layer, (0, 0), stripes_layer)

    # 4. Save Master PNG (512x512)
    icon_512 = final_img.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save("icon.png", format="PNG")
    
    # Save to static as well
    os.makedirs("static", exist_ok=True)
    icon_512.save("static/icon.png", format="PNG")

    # 5. Save multi-resolution Windows ICO
    # Windows icon formats: 256, 128, 64, 48, 32, 16
    sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    icon_512.save(
        "icon.ico",
        format="ICO",
        sizes=sizes
    )
    icon_512.save(
        "static/favicon.ico",
        format="ICO",
        sizes=sizes
    )
    print("Generated icon.ico and icon.png successfully!")

if __name__ == "__main__":
    create_bumble_icon()
