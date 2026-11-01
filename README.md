# Spotify Liked Songs → YouTube Music

Pasa tus **"Canciones que te gustan"** de Spotify a los **"Me gusta"** de YouTube Music, gratis y sin límite de canciones.
Move your Spotify **Liked Songs** to YouTube Music **likes**, for free and with no song limit.

[Español](#español) · [English](#english)

---

## Español

Es un script que pegas en la consola de tu navegador, dentro de music.youtube.com. Lee un CSV exportado de Spotify, busca cada canción en YouTube Music y le da "Me gusta" solo cuando coinciden el **título** y al menos un **artista**. No necesitas instalar nada, ni crear apps de desarrollador, ni pagar.

### Cómo usarlo

1. **Exporta tus canciones.** Entra a [exportify.net](https://exportify.net), inicia sesión con Spotify y descarga **Liked Songs** en CSV.
2. Abre **https://music.youtube.com** en Chrome (u otro navegador basado en Chromium) con tu sesión iniciada.
3. Abre las herramientas de desarrollador (`F12`) y entra a la pestaña **Console / Consola**.
4. Copia todo el contenido de [`ytm_likes.js`](ytm_likes.js), pégalo en la consola y presiona **Enter**.
   - Si el navegador bloquea el pegado, escribe `allow pasting`, Enter, y pega de nuevo.
5. Aparece un cuadro abajo a la derecha. Pulsa **Elegir Liked_Songs.csv** y selecciona tu archivo.
6. Espera. Con 1500 canciones tarda alrededor de una hora. Al terminar descarga `no_encontradas.txt` con las canciones que no encontró.

### Consejos

- **Deja la pestaña visible**, mejor en su propia ventana. Los navegadores ralentizan las pestañas ocultas y el proceso puede volverse muy lento.
- **Evita que el equipo se suspenda** mientras corre.
- **Para detenerlo:** escribe `__ytlkStop = true` en la consola.
- **Para continuar** si se cortó: vuelve a pegar el script y elige el mismo CSV. Retoma donde quedó. Para empezar de cero, ejecuta `localStorage.removeItem('__ytlk_next_N')`, donde `N` es la cantidad de canciones únicas de tu CSV (aparece en el contador `i / N`).
- **Velocidad:** en la parte superior del script puedes cambiar `DELAY_MIN` y `DELAY_MAX`. Pausas más cortas van más rápido pero aumentan el riesgo de que YouTube limite tu cuenta temporalmente.
- Las canciones que ya tenían "Me gusta" no se duplican.
- Las canciones repetidas en el CSV (mismo título y primer artista) se procesan una sola vez.

### Cómo funciona

Para cada canción hace una búsqueda filtrada por canciones en YouTube Music, elige el primer resultado cuyo título y artista coinciden y le da "Me gusta". Usa las mismas peticiones internas que usa la página web de YouTube Music, con tu sesión ya iniciada. **Todo ocurre en tu navegador:** el script no envía tu CSV ni tus datos a ningún otro sitio, y solo se comunica con `music.youtube.com`.

### Advertencias

- **No es oficial.** Usa endpoints internos de YouTube Music que pueden cambiar sin aviso y romper el script.
- Automatizar acciones puede ir en contra de las condiciones de servicio de YouTube. **Úsalo bajo tu propia responsabilidad**, con tu propia cuenta, y no a un ritmo abusivo.
- Puede equivocarse con canciones de títulos muy genéricos. Revisa el resultado en "Música que te gustó". Las que no encuentre con seguridad las deja sin tocar.
- **No subas tu CSV a ningún repositorio público:** contiene tus datos de Spotify.
- Nunca pegues en la consola código que no entiendas. Lee `ytm_likes.js` antes de ejecutarlo; es corto y no hace nada fuera de lo descrito aquí.

---

## English

A script you paste into your browser console on music.youtube.com. It reads a CSV exported from Spotify, searches each song on YouTube Music and likes it only when the **title** and at least one **artist** match. Nothing to install, no developer apps to create, no payment.

### Usage

1. **Export your songs.** Go to [exportify.net](https://exportify.net), sign in with Spotify and download **Liked Songs** as CSV.
2. Open **https://music.youtube.com** in Chrome (or another Chromium browser), signed in.
3. Open DevTools (`F12`) and go to the **Console** tab.
4. Copy the whole content of [`ytm_likes.js`](ytm_likes.js), paste it in the console and press **Enter**.
   - If your browser blocks pasting, type `allow pasting`, Enter, and paste again.
5. A box appears at the bottom right. Click **Choose Liked_Songs.csv** and pick your file.
6. Wait. About an hour for 1500 songs. When it finishes it downloads `not_found.txt` with the songs it could not match.

### Tips

- **Keep the tab visible**, ideally in its own window. Browsers throttle hidden tabs and the run can become very slow.
- **Don't let your computer sleep** while it runs.
- **To stop:** type `__ytlkStop = true` in the console.
- **To resume** after an interruption: paste the script again and choose the same CSV. It continues where it left off. To start over, run `localStorage.removeItem('__ytlk_next_N')`, where `N` is the number of unique songs in your CSV (shown in the `i / N` counter).
- **Speed:** change `DELAY_MIN` and `DELAY_MAX` at the top of the script. Shorter delays are faster but raise the risk of YouTube temporarily rate-limiting your account.
- Songs that are already liked are not duplicated.
- Duplicate rows in the CSV (same title and first artist) are processed once.

### How it works

For each song it runs a songs-only search on YouTube Music, picks the first result whose title and artist match, and likes it. It uses the same internal requests as the YouTube Music web app, with your existing signed-in session. **Everything runs in your browser:** the script does not send your CSV or any data anywhere else; it only talks to `music.youtube.com`.

### Disclaimer

- **Unofficial.** It relies on internal YouTube Music endpoints that can change without notice and break the script.
- Automating actions may go against YouTube's terms of service. **Use it at your own risk**, with your own account, and not at an abusive pace.
- It can be wrong on songs with very generic titles. Check the result in your liked songs list. Songs it cannot match with confidence are left untouched.
- **Do not commit your CSV to a public repository:** it contains your Spotify data.
- Never paste code you don't understand into the console. Read `ytm_likes.js` before running it; it is short and does nothing beyond what is described here.

---



Licencia / License: [MIT](LICENSE)
