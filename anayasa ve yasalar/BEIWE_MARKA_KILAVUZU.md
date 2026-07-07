# Beiwe — Marka Kılavuzu
### Brand Guideline · v1.1

*Bu doküman, Beiwe Kitabı'nın (Bölüm 6 — Tasarım Dili) uygulamalı uzantısıdır. Kitap ilkeyi tanımlar; bu kılavuz, o ilkenin logo ve marka üzerindeki somut kullanım kurallarını tanımlar.*

---

## 1. Logo Ailesi

Beiwe'nin marka işareti tek bir fikre dayanır: **tek bir kesintisiz gövde içinde iki sessiz harf.** Kalın, tek parça bir "B" gövdesinin içinden turuncu bir "W" geçer. Harf ayrı bir dekorasyon değildir — B'nin etinden çıkar, ona kazınmıştır.

Üç birincil varyant vardır:

| Varyant | Kullanım Alanı |
|---|---|
| **İkon** (siyah gövde + turuncu W) | Açık zeminler, landing page, dokümanlar |
| **Ters (Reversed)** (krem gövde + turuncu W) | Koyu zeminler, dark mode, uygulama ikonu |
| **Tek Renk (Monochrome)** | Damga, kabartma, tek renkli baskı, gravür |

**Kural:** Turuncu vurgu her koşulda sabit kalır. Tek renk baskı dışında, W asla ikonun gövdesiyle aynı renkte gösterilmez — bu, markanın "tek vurgu, tek anlam" ilkesinin (Kitap, Bölüm 6) doğrudan uzantısıdır.

---

## 2. Clear Space (Boşluk Payı)

İkonun etrafında, hiçbir metnin, çizginin veya başka bir grafiğin giremeyeceği bir güvenlik alanı tanımlıdır. Bu alan, ikonun dikey çubuğunun genişliği kadardır (referans birim = 1x). Logonun herhangi bir kenarı, bu 1x mesafeden daha yakın hiçbir öğeye komşu olamaz.

*Bu kural, kitabın Bölüm 4 ilkesiyle (“Tarayıcı düşünmeyi asla kesintiye uğratmaz”) aynı mantığı taşır: logo da sıkışmış, kalabalık bir alanda "gürültüye" karışmamalıdır.*

---

## 3. Minimum Boyut

İkon, **24×24 px** altına düşürülmemelidir. Bu boyutun altında W'nin iç çizgisi görsel olarak kayboluyor ve şekil sade bir "B" blobuna dönüşüyor — bu, markanın kimliğini taşımaz.

- Favicon / tarayıcı sekmesi: 32×32 px (önerilen minimum)
- Uygulama ikonu: 48×48 px ve üzeri
- Dokümanlarda satır içi kullanım: en az 20 px yükseklik

---

## 4. Dark Mode / Light Mode

| Mod | Zemin | İkon |
|---|---|---|
| **Light Mode** | #FAFAF8 (Kağıt) | Siyah gövde + turuncu W |
| **Dark Mode** | #171717 (Ink) | Krem gövde + turuncu W |

Turuncu W, her iki modda da aynı hex değeri (#D98A26) ile sabit kalır — kullanıcı arayüzü karanlığa geçtiğinde bile Beiwe'nin "imzası" değişmez. Bu tutarlılık, markanın tanınabilirliğinin temelidir.

---

## 5. Favicon

Favicon olarak yalnızca **İkon** varyantı kullanılır — asla Primary Lockup (ikon + kelime) değil. Tarayıcı sekmesi gibi son derece küçük alanlarda kelime markası okunmaz hale gelir; ikonun kendisi tek başına yeterince ayırt edicidir.

Favicon arka planı her zaman şeffaf veya kağıt tonu (#FAFAF8) olmalıdır — tarayıcının kendi sekme rengiyle çakışmayı önler.

---

## 6. Uygulama İkonu (App Icon)

Uygulama ikonu, ters (reversed) varyantın yuvarlatılmış kare bir zemin üzerine yerleştirilmiş halidir:

- Zemin: #171717 (Ink), köşe yarıçapı zemin genişliğinin ~%20'si (iOS/Android/macOS "superellipse" hissine yakın durur)
- İkon, zeminin ortasında, kenarlardan clear space kuralına uyacak şekilde konumlanır
- Bu tasarım Windows, macOS, iOS ve Android ikon sistemlerinin hepsinde doğal görünecek şekilde nötrdür — hiçbir platforma özel keskin köşe veya farklı oran gerekmez

---

## 7. Browser Toolbar (Tarayıcı Araç Çubuğu)

Beiwe'nin kendi tarayıcı kabuğunda (Bölüm 6, Sidebar/Navigation), ikon yalnızca şu iki yerde belirir:
1. **Sekme (tab) içinde** — favicon boyutunda, sekme başlığının solunda
2. **Sol dikey ikon rayının en üstünde** — uygulamanın "ana sayfa / kimlik" çıpası olarak, diğer nötr gri ikonlardan farklı olarak her zaman tam renkli (siyah + turuncu) gösterilir

Adres çubuğunun içinde veya arama kutusunun içinde logo **asla** kullanılmaz — bu alan Bölüm 6'da tanımlanan "en kutsal bileşen" olan arama çubuğuna aittir, marka orada sessiz kalır.

---

## 8. Wordmark (Kelime Markası)

- Font: **Playfair Display** (serif, editoryal)
- Her zaman büyük/küçük harf karışık: "Beiwe" — tamamı büyük harf (BEIWE) veya tamamı küçük harf (beiwe) kullanılmaz
- Wordmark tek başına kullanıldığında (ikon olmadan), rengi bağlama göre ink (#171717) veya kağıt (#FAFAF8) olur — asla turuncu renkte yazılmaz. Turuncu yalnızca ikonun W'sine aittir, kelimeye taşınmaz

**İkon + Wordmark arası boşluk:** Lockup'ta ikon ile "Beiwe" kelimesi arasındaki boşluk, ikonun kendi genişliğinin en az %35'i kadar olmalıdır — dar bırakılırsa sıkışık, amatör bir his verir (v1.0'daki hata buydu; v1.1'de düzeltildi).

---

## 9. Yasak Kullanımlar

Aşağıdakilerin hiçbiri yapılamaz:

- ❌ **Oranları bozmak** — ikonu yatayda veya dikeyde orantısız sıkıştırmak/germek
- ❌ **Vurgu rengini değiştirmek** — W'yi turuncu dışında bir renkte göstermek (mavi, mor, kırmızı vb.)
- ❌ **Döndürmek veya eğmek** — ikon her zaman dik durur, hiçbir açıyla döndürülmez
- ❌ **Gölge veya parlaklık eklemek** — logo düz, iki (veya tek) renkli bir işarettir; drop-shadow, gradient, bevel gibi efektler eklenmez
- ❌ **Gövde ve W'nin yerini değiştirmek** — W her zaman gövdenin *içinde* kalır, dışına taşmaz veya gövdeden ayrı bir öğe olarak kullanılmaz
- ❌ **Wordmark'ı başka bir fontla yazmak** — Playfair Display dışında bir serif veya herhangi bir sans-serif ile "Beiwe" yazılmaz

---

## 10. Renk Sistemi

| Renk | Hex | Anlamı |
|---|---|---|
| **Ink** | `#171717` | Metin, ikon gövdesi, birincil zemin (dark mode) |
| **Burnt Orange (Accent)** | `#D98A26` | Yalnızca eylem ve marka imzası (W) için — dekoratif değil |
| **Kağıt (Paper)** | `#FAFAF8` | Birincil zemin (light mode) |
| **Uzlaşı Yeşili (Consensus)** | `#1FA34A` | Yalnızca kolektif zekâ uzlaşı rozetlerinde (Kitap, Bölüm 6) |

*v1.0'da kullanılan parlak turuncu (#F5941A) ve saf siyah (#141311), v1.1'de daha "burnt" ve premium hissettiren #D98A26 ve #171717 ile değiştirilmiştir.*

---

## 11. Tipografi

- **Başlıklar / Editoryal:** Playfair Display
- **Arayüz / Gövde metni:** Outfit
- **Kural:** Bir ekranda asla üçüncü bir font ailesi kullanılmaz (Kitap, Bölüm 6 ile birebir aynı kural).

---

## 12. UI Örnekleri

- **Tarayıcı sekmesi:** favicon boyutunda ikon + gri sekme zemini + "beiwe.app" gibi bir URL etiketi
- **Landing page navbar:** sol üstte Primary Lockup (ikon + wordmark), sağda "Download" turuncu buton
- **Sol ikon rayı:** yalnızca en üstteki Beiwe çıpası tam renkli, altındaki navigasyon ikonları nötr gri

---

## 13. Beiwe Book Kapağı — Bağımsız "W" Kullanımı

Beiwe Kitabı'nın kapağında, tam ikon yerine yalnızca **W çizgisinin kendisi**, büyütülmüş ve yalnız başına, koyu (#171717) bir zemin üzerinde krem renkte kullanılabilir:

```
        W

   Beiwe Book

The Constitution of Clarity
```

Bu, Apple'ın İnsan Arayüzü Kılavuzu (HIG) kapaklarındaki sadelikten ilham alır: tek bir güçlü sembol, altında iki satır tipografi, başka hiçbir şey. Bu kullanım yalnızca kitap kapağı ve benzeri "editoryal, tek başlıklı" yüzeylerle sınırlıdır — ürün arayüzünde W hiçbir zaman B'siz, tek başına bir marka işareti olarak kullanılmaz. Ürün içinde marka her zaman bütün ikondur; kitapta ise W, markanın "imzası" olarak öne çıkabilir.

---

## 14. Logo Construction (İnşa Şeması)

Beiwe ikonu, **8px temel birim** üzerine kurulu bir grid ile inşa edilir:

- Toplam ikon yüksekliği: 27 birim (216px @ 8px grid)
- Dikey çubuk genişliği: 4 birim (32px)
- W stroke kalınlığı: 2 birim (16–17px)
- Gövde elipslerinin yarıçapları: 9–10 birim aralığında

**Kural:** Final prodüksiyon vektöründe tüm ölçüler bu 8px grid'e yuvarlanır. Bu, yalnızca estetik bir tercih değil, Beiwe UI'ının kendi 8px spacing sistemiyle (Bölüm 6, Spacing & Grid) birebir aynı matematiği paylaşması demektir — logo, arayüzün kullandığı grid dilinin dışında bir "yabancı obje" değildir.

Tüm stroke'lar **round cap** ve **round join** kullanır; hiçbir yerde keskin uç veya köşeli birleşim bulunmaz — bu, markanın "editoryal, sert olmayan" karakterinin (Bölüm 6) çizgi seviyesindeki karşılığıdır.

---

## 15. Optical Alignment (Optik Hizalama)

Logo, matematiksel olarak değil, **optik olarak** hizalanır. Apple'ın İnsan Arayüzü Kılavuzu'nda da vurgulandığı gibi, geometrik merkez ile görsel merkez nadiren aynı noktadır:

- Gövdenin sağa doğru şişkin kısmı, dikey çubukla görsel ağırlık dengesi kurabilmek için matematiksel bounding box'ın biraz dışına taşacak şekilde çizilir — aksi halde çubuk "daha ağır" görünür.
- İkon + Wordmark lockup'ında, ikon ile "Beiwe" kelimesinin dikey hizalanması **baseline'a göre değil, gözle** yapılır: serif fontun x-height'ı ile ikonun görsel merkezi çoğu zaman matematiksel ortalamadan birkaç piksel farklıdır.
- Yuvarlak biçimler (gövde elipsleri), köşeli biçimlerle (dikey çubuk) yan yana geldiğinde insan gözüne küçük görünme eğilimindedir; bu yüzden yuvarlak kısımlar mekanik ölçümden ~%2-3 daha büyük çizilir.

**Kural:** Hiçbir hizalama kararı yalnızca "ölçü aynı" olduğu için doğru kabul edilmez; her zaman gözle son kontrol yapılır.

---

## 16. Animation (Açılış Hareketi)

Logo açılırken **döndürülmez** (Bölüm 9, Yasak Kullanımlar ile tutarlı). Standart açılış hareketi iki aşamalıdır ve markanın kendi felsefesini taklit eder — **önce bağlam oluşur, netlik en son gelir:**

1. **Gövde (siyah/krem B):** 300ms, ease-out ile fade + hafif scale-in (0.92 → 1.0). Bu, "bağlamın toplanması" anını temsil eder.
2. **W (turuncu):** Gövde tamamlandıktan hemen sonra, 400–500ms boyunca bir *stroke-draw* animasyonuyla (stroke-dashoffset ile çizilerek) belirir — sanki çizgi o an çiziliyormuş gibi. Bu, "netliğin karmaşadan doğduğu an"ın somutlaşmış halidir.

**Toplam süre:** 900ms'yi geçmez. Her aşama kendi içinde Bölüm 8'deki (Hareket Dili) 600ms üst sınırına uyar; bu yalnızca marka açılışı (splash/loading) gibi özel bağlamlar için tanımlı istisnai bir çok-aşamalı dizidir, sıradan UI geçişlerinde kullanılmaz.

**Yasak:** Rotation, bounce, elastic/spring efektleri, W'nin gövdeden bağımsız olarak "uçarak gelmesi."

---

## 17. Accessibility (Erişilebilirlik)

Logo bir grafik nesne olarak WCAG 2.1'in **1.4.11 Non-Text Contrast** kriterine tabidir (metin değil, grafik/simge kontrastı — minimum **3:1**):

| Kombinasyon | Yaklaşık Kontrast Oranı | Durum |
|---|---|---|
| Ink (#171717) / Kağıt (#FAFAF8) | ~18.5:1 | AAA (metin dahil her bağlamda geçer) |
| Krem gövde / Ink zemin (dark mode) | ~18.5:1 | AAA |
| Turuncu W (#D98A26) / Ink gövde (#171717) | ~4.5:1 | AA sınırında — grafik nesne için yeterli (≥3:1), ancak W hiçbir zaman gövdeden bağımsız, düz metin gibi kullanılmamalıdır |

**Kural:** Turuncu W, yalnızca ikonun *içinde*, ink veya kağıt zeminine karşı kullanılır. W'nin tek başına küçük, metin-benzeri bir etiket olarak (örn. bir bildirim rozetinde "W" harfi olarak) kullanılması gereken bir senaryo çıkarsa, kontrastı artırmak için W'ye ince bir ink kontur eklenir veya boyutu büyütülür.

---

## 18. Icon Radius (Platform Köşe Yarıçapları)

Uygulama ikonu tek bir sabit köşe yarıçapıyla teslim edilmez; her platformun kendi maskeleme sistemine göre farklı bir güvenli alan tanımı kullanılır:

| Platform | Yaklaşım |
|---|---|
| **iOS / iPadOS** | Apple'ın kendi "squircle" maskesi uygulanır; Beiwe yalnızca tam kare, dolgusuz bir kaynak dosya teslim eder. |
| **macOS (Big Sur+)** | Sistem, ikonu kendi squircle şablonuna oturtur; teslim edilen kaynakta ikon, kenarlardan geniş bir iç boşluk (padding) bırakır. |
| **Android (Adaptive Icon)** | İşletim sistemi ikonu daire, squircle, yuvarlak kare veya damla şeklinde maskeleyebilir; ikon, tuval genişliğinin ~%66'sını kaplayan bir "güvenli alan" dairesi içinde tutulur. |
| **Windows (Fluent)** | Sabit ~%20 köşe yarıçapı; iOS kadar agresif yuvarlama yapılmaz, kılavuzdaki 44px/rx=16 oranı doğrudan kullanılabilir. |
| **Web / Favicon** | Köşe yarıçapı tanımlanmaz; tarayıcı kendi sekme şeklini uygular. |

**Kural:** Beiwe her platform için ayrı, maskesiz/dolgusuz bir kaynak dosya üretir; köşe yuvarlatmayı asla kendisi sabitlemez — bu, platformun kendi vizüel dilini bozar.

---

## 19. Logo Sistemi ve Alt Markalar (Product Family)

Beiwe büyüdükçe bir ürün ailesine dönüşecektir: *Beiwe*, *Beiwe Book*, *Beiwe Labs*, *Beiwe Enterprise*, *Beiwe Browser* gibi. Apple'ın Watch/TV/Music ailesinde olduğu gibi, bu genişleme **tek bir sistemden türemelidir** — her alt ürün kendi logosunu icat etmez.

**Sabit kalan (asla değişmez):**
- B+W gövde geometrisi, oranları ve stroke ağırlıkları
- Turuncu W'nin gövdenin *içinde* kalması kuralı
- 8px construction grid'i

**Alt markaların türeme kuralı:**
- Farklılaşma yalnızca **wordmark eki** ile yapılır: aynı Playfair Display fontuyla, ikonun yanına "Book", "Labs", "Enterprise", "Browser" gibi bir ikinci kelime eklenir — *"Beiwe Labs"* gibi. İkonun kendisi hiçbir zaman değiştirilmez, üzerine rozet/amblem eklenmez, yeniden renklendirilmez.
- İstisnai olarak, yalnızca deneysel/iç programlar (örn. *Beiwe Labs*) için turuncunun **desatüre edilmiş** bir tonu kullanılabilir — bu, "bu deneyseldir, henüz kanonik değildir" sinyali verir. Çekirdek ürün (*Beiwe*, *Beiwe Browser*, *Beiwe Enterprise*) her zaman kanonik `#D98A26` kullanır.
- Yeni bir alt marka eklenmeden önce bu kılavuzun 9. bölümündeki (Yasak Kullanımlar) hiçbir kuralın ihlal edilmediği kontrol edilir.

**Kural:** Bir alt marka, ikonuna bakıldığında "bu bir Beiwe ürünü" olduğu anında anlaşılmalıdır — farklılık yalnızca yazıda olmalı, şekilde değil.

---

## 20. Brand Philosophy (Marka Felsefesi)

*Bu bölüm, Beiwe Kitabı'nın Manifesto'suyla (Bölüm 2) markanın görsel sistemini birbirine bağlayan kapanış bölümüdür.*

> **The logo is intentionally quiet. It is not designed to attract attention. It is designed to be remembered.**
> *Logo kasıtlı olarak sessizdir. Dikkat çekmek için değil, hatırlanmak için tasarlanmıştır.*

> **The orange W represents the moment when clarity emerges from complexity.**
> *Turuncu W, netliğin karmaşadan doğduğu anı temsil eder.*

> **A logo that shouts is a logo that is forgotten by tomorrow. A logo that whispers is the one you draw from memory years later.**
> *Bağıran bir logo yarın unutulur. Fısıldayan bir logo, yıllar sonra hafızandan çizebildiğin logodur.*

> **We did not design a symbol to be seen once. We designed a mark to be recognized in a glance, and understood over time.**
> *Bir kez görülsün diye bir sembol tasarlamadık. Bir bakışta tanınacak, zamanla anlaşılacak bir işaret tasarladık.*

Bu logo bir dekorasyon değildir. Beiwe Kitabı'nın Bölüm 3'ünde tanımlanan Netlik Modeli'nin — bağlamın önce toplanıp netliğin en son ortaya çıktığı fikrinin — tek bir grafik işarette sıkıştırılmış halidir. Gövde bağlamdır; W, o bağlamın içinden çıkan cevaptır. Marka büyüdükçe, yeni ürünler eklendikçe, yeni ekranlar tasarlandıkça — bu tek cümle her kararın sınavı olmalıdır: *Bu, sessiz kalıyor mu, yoksa bağırıyor mu?*

---

*Bu kılavuz, Beiwe Kitabı'nın Bölüm 6'sıyla birlikte yaşayan bir dokümandır ve marka olgunlaştıkça güncellenir.*
