function _baseHeader(tituloCorreo, mainTitle) {
    return head = `
<body style="margin:0;padding:0;background-color:#f7f7f7;-webkit-text-size-adjust:none;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f7f7f7;">
    <tr>
      <td align="center" style="padding:12px 10px;">
        <!-- container -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e6e6e6;border-radius:6px;overflow:hidden;">
          <!-- header row: light accent bar -->
          <tr>
            <td style="padding:0 20px 0 20px;background-color:#ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <!-- logo left -->
                  <td valign="middle" style="padding:18px 0;">
                    <a href="https://imgbb.com/" style="display:inline-block;text-decoration:none;">
                      <img src="https://i.ibb.co/ZxScX13/Icon.png" alt="logo" width="64" style="display:block;border:0;line-height:100%;outline:none;text-decoration:none;">
                    </a>
                  </td>
                  <!-- title right -->
                  <td valign="middle" style="padding:18px 0;text-align:right;">
                    <div style="font-family: Arial, Helvetica, sans-serif;font-size:16px;color:#1b1b1b;line-height:1; font-weight:600;">
                      ${mainTitle}
                    </div>
                    <div style="font-family: Arial, Helvetica, sans-serif;font-size:12px;color:#666666;line-height:1;margin-top:4px;">
                      Sistema Integral Operativo · Notificación automática
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- spacer thin accent -->
          <tr>
            <td style="background-color:#ffffff;border-top:4px solid #e9f2ff;padding:0;"></td>
          </tr>

          <!-- body content -->
          <tr>
            <td style="padding:28px 30px 18px 30px;background:#ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="font-family: Arial, Helvetica, sans-serif;color:#1c2831;font-size:22px;line-height:26px;padding-bottom:8px;font-weight:700;">
                    ${tituloCorreo}
                  </td>
                </tr>
                <tr>
                  <td style="font-family: Arial, Helvetica, sans-serif;color:#39424a;font-size:14px;line-height:20px;padding-bottom:12px;">
                    <!-- contenido del correo continua desde aquí -->
`;
}

function header(tituloCorreo) {
    return _baseHeader(tituloCorreo, 'Solicitud de Material');
}

function header2(tituloCorreo) {
    return _baseHeader(tituloCorreo, 'Nueva Orden de Producción');
}

function header3(tituloCorreo) {
    return _baseHeader(tituloCorreo, 'Devolución de Material');
}

function header4(tituloCorreo) {
    return _baseHeader(tituloCorreo, 'Nuevo Despacho');
}

function header5(tituloCorreo) {
    return _baseHeader(tituloCorreo, 'Asignación de Material');
}

function header6(tituloCorreo) {
    return _baseHeader(tituloCorreo, 'Nueva Solicitud de Material');
}

function header7(tituloCorreo, header) {
    // header = título dinámico en la cabecera grande
    return _baseHeader(tituloCorreo, header || 'Notificación');
}

function header__(Titulo, tituloCorreo) {
    // signature mantenida: primer arg es el título grande en la cabecera, segundo es el título del contenido.
    return _baseHeader(tituloCorreo, Titulo || 'Notificación');
}

const footer = `
                </td>
              </tr>

              <!-- separador -->
              <tr>
                <td style="padding-top:10px;">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid #eef0f2;">
                    <tr>
                      <td style="padding:12px 0 0 0;font-family: Arial, Helvetica, sans-serif;font-size:13px;color:#5b6268;line-height:18px;">
                        <strong>Importante:</strong> Este es un mensaje generado automáticamente. Por favor no responda a este correo.
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0 0 0;font-family: Arial, Helvetica, sans-serif;font-size:12px;color:#7a8086;line-height:18px;">
                        2026 © Poligrafica Industrial C.A - Sistema SIO.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
      <!-- end container -->
      </td>
    </tr>
  </table>
</body>`;


module.exports = {
    header,
    header2,
    header3,
    header4,
    header5,
    header6,
    header7,
    header__,
    footer
};