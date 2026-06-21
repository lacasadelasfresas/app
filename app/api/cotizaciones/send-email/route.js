import { Resend } from 'resend'

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { cotizacion } = body

    if (!cotizacion?.cliente_email) {
      return Response.json(
        { error: 'La cotización no tiene un email de cliente.' },
        { status: 400 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const itemsHtml = (cotizacion.items || [])
      .map(
        (item) => `
          <tr>
            <td style="padding:12px;border-bottom:1px solid #f1dede;">
              ${escapeHtml(item.descripcion)}
            </td>
            <td style="padding:12px;border-bottom:1px solid #f1dede;text-align:center;">
              ${escapeHtml(item.cantidad)}
            </td>
            <td style="padding:12px;border-bottom:1px solid #f1dede;text-align:right;">
              ${formatCurrency(item.precio_unitario)}
            </td>
            <td style="padding:12px;border-bottom:1px solid #f1dede;text-align:right;font-weight:700;">
              ${formatCurrency(
                Number(item.cantidad || 0) *
                  Number(item.precio_unitario || 0)
              )}
            </td>
          </tr>
        `
      )
      .join('')

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: [cotizacion.cliente_email],
      subject: `Cotización ${cotizacion.numero} | La Casa de las Fresas`,
      html: `
        <div style="font-family:Arial,sans-serif;background:#fcf8f8;padding:32px;color:#2e2e2e;">
          <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #f1dede;border-radius:24px;overflow:hidden;">
            <div style="padding:28px;background:#fff7f7;border-bottom:1px solid #f1dede;">
              <p style="margin:0;color:#b07a7a;font-size:12px;letter-spacing:2px;text-transform:uppercase;">
                La Casa de las Fresas
              </p>
              <h1 style="margin:12px 0 0;color:#7a0000;font-size:30px;">
                Cotización ${escapeHtml(cotizacion.numero)}
              </h1>
              <p style="margin:10px 0 0;color:#b07a7a;">
                Hola ${escapeHtml(cotizacion.cliente_nombre)}, gracias por considerar nuestros servicios.
              </p>
            </div>

            <div style="padding:28px;">
              <p><strong>Fecha:</strong> ${escapeHtml(cotizacion.fecha)}</p>
              <p><strong>Válida hasta:</strong> ${escapeHtml(cotizacion.valida_hasta || 'Sin fecha definida')}</p>

              <table style="width:100%;border-collapse:collapse;margin-top:24px;">
                <thead>
                  <tr style="background:#f8eeee;color:#8c0303;">
                    <th style="padding:12px;text-align:left;">Descripción</th>
                    <th style="padding:12px;text-align:center;">Cantidad</th>
                    <th style="padding:12px;text-align:right;">Precio</th>
                    <th style="padding:12px;text-align:right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <div style="margin-top:24px;padding:18px;background:#fffafa;border-radius:16px;">
                <p style="margin:0 0 8px;text-align:right;">
                  Subtotal: <strong>${formatCurrency(cotizacion.subtotal)}</strong>
                </p>
                <p style="margin:0 0 8px;text-align:right;">
                  Descuento: <strong>${formatCurrency(cotizacion.descuento)}</strong>
                </p>
                <p style="margin:0 0 8px;text-align:right;">
                  ITBMS: <strong>${formatCurrency(cotizacion.impuesto)}</strong>
                </p>
                <p style="margin:16px 0 0;text-align:right;color:#7a0000;font-size:22px;">
                  Total: <strong>${formatCurrency(cotizacion.total)}</strong>
                </p>
              </div>

              ${
                cotizacion.notas
                  ? `
                    <div style="margin-top:24px;">
                      <p style="font-weight:700;color:#7a0000;">Notas</p>
                      <p style="color:#6f6f6f;line-height:1.6;">
                        ${escapeHtml(cotizacion.notas)}
                      </p>
                    </div>
                  `
                  : ''
              }
            </div>

            <div style="padding:20px 28px;background:#fff7f7;color:#b07a7a;font-size:13px;">
              Esta cotización puede estar sujeta a disponibilidad de productos e insumos.
            </div>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Error de Resend:', error)

      return Response.json(
        { error: 'No se pudo enviar el email.' },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error enviando cotización:', error)

    return Response.json(
      { error: 'Ocurrió un error inesperado.' },
      { status: 500 }
    )
  }
}