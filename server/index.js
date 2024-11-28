import express from "express";
import cors from "cors";
import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken:
    "APP_USR-5002262327522339-110611-d2dfcbaa10598f2336e9c4b9ded29dd7-1338912701",
});

const app = express();
// Configuración de CORS
app.use(
  cors({
    origin: "http://localhost:5173", // Permitir solo el frontend que corre en este puerto
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
const port = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Soy el server :)");
});

// Endpoint para crear una preferencia desde el detalle del producto
app.post("/create_preference", async (req, res) => {
  try {
    const body = {
      items: [
        {
          title: req.body.title,
          quantity: Number(req.body.quantity),
          unit_price: Number(req.body.price),
          currency_id: "ARS",
          description: req.body.description,
          picture_url: req.body.productImageUrl,
        },
      ],
      back_urls: {
        success: "https://portfolio-mdev-react.netlify.app/",
        failure: "https://portfolio-mdev-react.netlify.app/",
        pending: "https://portfolio-mdev-react.netlify.app/",
      },
      auto_return: "approved",
    };

    const preference = new Preference(client);
    const result = await preference.create({ body });
    res.json({
      id: result.id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Error al crear la preferencia: (",
    });
  }
});

app.post("/create_preference_cart", async (req, res) => {
  try {
    const cartItems = req.body.cartItems;

    // Validación de los elementos del carrito
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        error: "El carrito está vacío o no contiene elementos válidos.",
      });
    }

    const items = cartItems.map((item) => {
      const quantity = Number(item.quantity);
      const unit_price = Number(item.price);

      if (isNaN(quantity) || isNaN(unit_price)) {
        throw new Error("La cantidad o el precio no son números válidos");
      }

      return {
        title: item.title,
        quantity,
        unit_price,
        description: item.description,
        picture_url: item.productImageUrl,
      };
    });

    const body = {
      items: items,
      back_urls: {
        success: "https://portfolio-mdev-react.netlify.app/",
        failure: "https://portfolio-mdev-react.netlify.app/",
        pending: "https://portfolio-mdev-react.netlify.app/",
      },
      auto_return: "approved",
    };

    const preference = new Preference(client);
    const result = await preference.create({ body });

    console.log("Respuesta de MercadoPago:", result); // Imprimir la respuesta completa de MercadoPago

    // Verificar si el ID de preferencia está presente
    if (result && result.body && result.body.id) {
      return res.json({
        id: result.body.id, // Responder con el ID de la preferencia
      });
    } else {
      throw new Error("Error: No se recibió un ID de preferencia válido.");
    }
  } catch (error) {
    console.error("Error al crear la preferencia:", error);
    res.status(500).json({
      error: error.message || "Error al crear la preferencia.",
    });
  }
});

app.listen(port, () => {
  console.log(`El servidor está corriendo en el puerto ${port}`);
});
