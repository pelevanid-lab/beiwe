# 📘 Beiwe Kitabı
### Netlik Tarayıcısının Anayasası

*Versiyon 1.1*

> "Beiwe için inşa edilen her şey bu kitaba uymak zorundadır."

Bu doküman bir pazarlama materyali değildir. Bir tasarım rehberi de değildir. Bu, Beiwe'nin var oluş nedenini, davranış kurallarını, karar mekanizmasını ve ticari duruşunu tanımlayan bir anayasadır. Sprint'ler gelir geçer, özellikler değişir, ekranlar yeniden tasarlanır — ama bu kitapta yazılanlar sabit kalır. Bir ekip üyesi bir karar verirken tereddüt ettiğinde, buraya bakar. Cevap burada değilse, cevap henüz yoktur; icat edilmemeli, bu kitaba danışılarak birlikte yazılmalıdır.

---

## Bölüm 1 — Beiwe Neden Var?
*Why Beiwe Exists*

**Amaç: Vizyon**

### Günümüz internetinin problemi
İnternet, otuz yıl önce bir bilgi kütüphanesi olarak doğdu. Bugün ise bir dikkat pazarı haline geldi. Bir soruyla tarayıcıya girip on iki sekme, otuz dakika ve hiçbir netlik olmadan çıkmak, modern dijital hayatın normalleşmiş bir arızasıdır. Kullanıcı bir şey öğrenmek ister, karşısına bir sonuç listesi çıkar; o listeyi anlamlandırmak, çelişkileri elemek ve bir karara varmak yine kullanıcının işidir. İnternet bilgiyi çoğalttı, ama anlamayı kolaylaştırmadı.

### Search paradigmasının sınırları
Arama motoru paradigması tek bir varsayım üzerine kuruludur: Kullanıcı ne aradığını zaten bilir, tarayıcının işi sadece en alakalı sayfaları sıralamaktır. Ancak gerçek hayattaki sorular nadiren bu kadar nettir. "Nereye taşınmalıyım?", "Hangi laptopu almalıyım?", "Bu sözleşmeyi imzalamalı mıyım?" gibi sorular, tek bir doğru cevabı olan sorgular değil; çok boyutlu, bağlama duyarlı ve kişiseldir. On mavi bağlantı, bu tür sorulara asla yeterli bir cevap olamaz. Arama motoru sonuç üretir; ama netlik üretmez.

### AI neden tek başına çözüm değil
Yapay zekâ sohbet asistanları bu sorunu kısmen çözdü: artık bağlantı listesi yerine düz bir cevap alıyoruz. Ama bu da yeni bir yanılsama yarattı. Tek bir model, tek bir bakış açısıdır; kendinden emin bir sesle konuşur, ama arkasında ne toplumsal uzlaşı ne de doğrulanabilir kaynak vardır. Kullanıcı, bir arama motorunun gürültüsünden kaçarken, bu kez bir modelin özgüvenli ama tek taraflı sesine teslim olur. Beiwe'nin reddettiği tam olarak budur: Yapay zekâ, tek bakış açısı sunan bir görüş kaynağıdır — hakikatin kendisi değil.

### Context neden kayboluyor
Bugünün tarayıcısı sekmeler üzerinden çalışır. Her sekme kendi başına bir adadır; birbirinden habersiz, birbirine bağlanmayan, oturum kapandığında yok olan geçici bilgi parçacıklarıdır. Kullanıcı dün araştırdığı şeyi bugün unutur, çünkü tarayıcının hafızası yoktur — sadece geçmişi (history) vardır, bu ise ham bir kayıt defteridir, anlamlandırılmış bir bağlam değil. Bir kullanıcı bir konuyu üç farklı günde üç farklı oturumda araştırdığında, tarayıcı bu üç oturumu asla birbirine bağlamaz. Bağlam, sekmeler kapandığı anda buharlaşır.

### Browser neden yeniden tasarlanmalı
Tarayıcı, otuz yıldır aynı temel metaforla çalışır: adres çubuğu, sekmeler, yer imleri. Bu metafor, bilgiye "gitmek" üzerine kuruludur — kullanıcı bir yere gider, bir şey okur, başka bir yere gider. Ama modern ihtiyaç artık gitmek değil, anlamaktır. Tarayıcının temel birimi artık "sayfa" değil, "soru" olmalıdır. Bu, arayüzün kozmetik bir güncellemesi değil; tarayıcının kendisinin ne olduğuna dair kök bir yeniden tanımdır.

### Clarity neden yeni hedef
Beiwe'nin ölçtüğü şey hız değildir, sonuç sayısı da değildir. Beiwe'nin tek bir hedefi vardır: **netlik**. Bir kullanıcı Beiwe'den çıktığında, girdiğinden daha bulanık değil, daha net olmalıdır. Bu, ürünün her kararını yönlendiren tek ölçüttür. Bir özellik netliği artırmıyorsa, o özellik Beiwe'de yer almamalıdır — ne kadar etkileyici, trend veya teknik olarak zorlayıcı olursa olsun.

---

## Bölüm 2 — Manifesto
*Manifesto*

**Amaç: Felsefe**

Bu bölüm teknik değildir. İlham vericidir. Burada yazılanlar bir özellik listesi değil, bir inanç beyanıdır.

> **We don't organize pages. We organize understanding.**
> *Biz sayfaları düzenlemiyoruz. Anlayışı düzenliyoruz.*

> **Questions are more important than answers.**
> *Sorular, cevaplardan daha önemlidir.*

> **Memory is the future of browsing.**
> *Hafıza, tarayıcılığın geleceğidir.*

> **The browser should think with you, not for you.**
> *Tarayıcı senin yerine değil, seninle birlikte düşünmelidir.*

> **A tab is a place. A question is a journey.**
> *Bir sekme bir yerdir. Bir soru ise bir yolculuktur.*

> **Search asks the web. Beiwe asks you.**
> *Arama motoru web'e sorar. Beiwe sana sorar.*

> **Clarity is not found. It is built.**
> *Netlik bulunmaz. İnşa edilir.*

> **We are not building a faster browser. We are building a clearer mind.**
> *Biz daha hızlı bir tarayıcı inşa etmiyoruz. Daha net bir zihin inşa ediyoruz.*

---

## Bölüm 3 — Netlik Modeli
*The Clarity Model*

**Amaç: Ürün Mantığı**

Eski arama motorları sıralı (sequential) çalışır: Soruyu sorarsın, beklersin, sonuçları alırsın. Beiwe ise **Paralel ve Kademeli (Progressive)** çalışır. Kullanıcıyı asla bekletmez; sonuçları sunarken aynı anda netliği inşa eder. Her ürün kararı, aşağıdaki paralel akışın bir yorumu olmak zorundadır.

```text
Question (Soru)
   │
   ├──> Akış A: Hemen Sonuç (Immediate Value)
   │      └──> Open Web & İlk Context
   │
   └──> Akış B: Kademeli Netlik (Progressive Clarification)
          ├──> Clarification (Netleştirme Çipleri)
          ├──> Deep Context (Derin Bağlam)
          ├──> Collective Intelligence (Kolektif Zekâ)
          └──> Verified Knowledge (Doğrulanmış Bilgi)
   │
   v (İki akışın birleşimi)
Decision (Karar)
   ↓
Memory (Hafıza)
```

### 1. Question (Soru)
Her şey bir soruyla başlar — bir arama terimiyle değil. Kullanıcı yazmaya başladığı an, sistem iki paralel akışı aynı anda başlatır.

### 2. Hemen Sonuç (Sıfır Sürtünme)
Eski modeldeki "önce soruyu netleştir, sonra sonuçları göster" mantığı terk edilmiştir. Soru gelir gelmez, sistem elindeki mevcut bağlamla (Open Web ve temel eşleşmeler) ilk sonuçları anında ana ekrana döker. Kullanıcı asla bekletilmez.

### 3. Progressive Clarification (Kademeli Netleştirme)
Ana ekranda sonuçlar akarken, arka planda (ContextDesk panelinde) eksik bağlamı doldurmak için netleştirme soruları belirir: "Kaç metrekare?", "Bütçe nedir?". Bu adım, arama motorlarının yapamadığı *dinleme* eylemidir.

### 4. Dinamik Context (Bağlam)
Kullanıcı netleştirme sorularını cevapladıkça, bağlam nesnesi anlık olarak güncellenir. Bu, ana ekrandaki sonuçların sayfa yenilenmeden, göz önünde anında elenmesini ve daha isabetli hale gelmesini sağlar.

### 5. Collective Intelligence (Kolektif Zekâ)
Bağlam yeterli netliğe ulaştığında, sistem benzer bağlamlarda diğer kullanıcıların ulaştığı uzlaşımları çağırır. Bireysel görüş, toplumsal doğrulamayla dengelenir.

### 6. Verified Knowledge (Doğrulanmış Bilgi)
Yine bağlam netleştikçe, konuya uyan onaylanmış, kaynaklı ve doğrulanmış çözümler (kayıtlı markalar, resmi veriler) sonuçlara katman olarak eklenir. 

### 7. Decision (Karar)
Kullanıcı, açık web'in ham bilgisi ile başlayıp, kendi bağlamı, kolektif zekâ ve doğrulanmış bilgilerle zenginleşen bu paralel akışın sonunda kendi kararını verir.

### 8. Memory (Hafıza)
Verilen karar, nedenleriyle birlikte Saule'nin hafıza katmanına yazılır. Bir sonraki soru için yeni ve daha güçlü bir bağlam (Cold Start'ı aşan bir zemin) olarak saklanır.

---

## Bölüm 4 — Browser İlkeleri
*Browser Principles*

**Amaç: Tarayıcı Davranışı**

**İlke 1 — Her şey bir soruyla başlar.**
**İlke 2 — Sekmelerden daha önemli olan bağlamdır.**
**İlke 3 — Her cevap kendini açıklamalıdır.**
**İlke 4 — Tarayıcı düşünmeyi asla kesintiye uğratmaz.** Bildirimler, sıçramalar, agresif yükleme ekranları yoktur.
**İlke 5 — Her etkileşim netliği artırmalıdır.**

---

## Bölüm 5 — Ürün İlkeleri
*Product Principles*

**Amaç: Karar Mekanizması**

**Search is not the product. Clarity is.** (Arama ürün değildir. Netlik üründür.)
**AI is one perspective. Never the truth.** (Yapay zekâ tek bir bakış açısıdır. Asla hakikat değildir.)
**Collective intelligence outranks popularity.** (Kolektif zekâ, popülerliğin önündedir.)
**Memory belongs to the user.** (Hafıza kullanıcıya aittir. Veri yereldir ve şifrelidir.)
**Transparency over optimization.** (Şeffaflık, optimizasyondan önce gelir.)

---

## Bölüm 6 — Tasarım Dili
*Design Language*

**Amaç: Görsel Sistem**

- **Typography:** Başlıklar Playfair Display (Editoryal, düşünen), gövde metni Outfit (Okunabilir, net).
- **Renkler:** Zemin kırık beyaz (#FAFAF8), Metin mürekkep tonu. Vurgu eylemleri için Turuncu-amber. Konsensüs/Uzlaşı sinyalleri için Yeşil.
- **Düzen:** Merkezi hizalı, dar bir içerik genişliği. Sağda "ContextDesk" (Bağlam Masası) paneli.
- **Bileşenler:** Arama çubuğu her zaman kutsaldır. Gölgeler minimaldir, derinlik hiyerarşiden gelir.

---

## Bölüm 7 — Etkileşim Dili
*Interaction Language*

**Amaç: Kullanıcı Akışı ve Sürtünme Yönetimi**

**Kademeli Netlik (Progressive Clarity) Akışı:**
1. Kullanıcı arama çubuğuna yarım bir ifade yazar: "Klima."
2. **Sıfır Sürtünme:** Sonuçlar anında akmaya başlar, boş sayfa veya bekleme yoktur.
3. **Sessiz Sorgulama:** Aynı anda, sağdaki ContextDesk panelinde netleştirme soruları (çipler) belirir ("Kaç m²?", "İklim?"). Kullanıcı "sorguya çekiliyormuş" gibi değil, "dinleniyormuş" gibi hisseder.
4. Kullanıcı sağ paneldeki bu soruları cevapladıkça (veya Beiwe ile sohbet ettikçe), ana ekrandaki sonuçlar anlık olarak elenir. Kullanıcı o an netliğin fiziksel olarak arttığını hisseder.
5. Kullanıcı bir karara varır ve bu karar Saule'ye `ingest` edilir.

---

## Bölüm 8 — Hareket Dili
*Motion Language*

**Amaç: Animasyon Sistemi**

Hareket, dikkat çekmek için değil, geçişleri anlamlandırmak için vardır. Home durumundan Results durumuna geçiş, ani bir sayfa değişimi değil, yumuşak bir genişleme animasyonudur. Kullanıcı "başka bir sayfaya gitti" hissetmez, "aynı sorunun derinleştiğini" hisseder. Süreler 200-400ms aralığında tutulur, düşünmeyi kesintiye uğratmaz.

---

## Bölüm 9 — Saule Entegrasyonu
*Saule Integration*

**Amaç: SML + Beiwe İlişkisi**

**Beiwe arayüzdür, Saule hafızadır.** Beiwe, Saule'ye referans verir; Saule asla Beiwe'ye referans vermez.
- **SML (Semantic Memory Layer):** Saule'nin kalıcı hafıza ağı.
- **Context:** O anki oturumda oluşan geçici bağlam.
- **Memory:** Karara dönüşüp Saule'ye yazılan bilgi.

### Soğuk Başlangıç (Cold Start) ve Tanışma
Sistem ilk kurulduğunda SML veritabanı boştur. Kolektif zekânın da zamanla birikmesi gerekir. Bu "soğuk başlangıç" anında Beiwe'nin kullanıcıyı anlayabilmesi için, ilk kurulumda kullanıcıyla kısa bir "tanışma sohbeti" (Onboarding) yapılır. Kullanıcının ilgi alanları ve temel öncelikleri bu sohbetle alınır ve doğrudan Saule'ye kaydedilir. Böylece ilk gerçek aramada sistem sıfırdan başlamaz.

---

## Bölüm 10 — Teknik Mimari
*Technical Architecture*

**Amaç: Kod ve Sistem**

```
Browser
   ↓
Frontend (Beiwe / Next.js)
   ↓
API (SMI — Semantic Memory Interface)
   ↓
Saule Core (SML / SPG / SQLite / Embeddings)
```
- API endpoint'leri `ingest`, `recall`, `connect`, `clarity` gibi isimler taşır.
- Kullanıcı verisi yerel cihazda tutulur ve şifrelenir.
- Oturum içi `Context` geçici state olarak kalır, ancak kullanıcı karar verdiğinde `ingest` edilir.

---

## Bölüm 11 — İş Modeli ve Ticari Etik
*Business Model & Commercial Ethics*

**Amaç: Şeffaf ve Güvenilir Gelir Modeli**

Beiwe, kullanıcı verisini satmaz ve manipülatif SEO/reklam modellerini reddeder. Ticari varlığını sürdürmek için "güven" üzerine kurulu, markaların kendi ürünlerini netlik testine soktuğu bir model kullanır.

### 1. Kolektif İnceleme Paketi (Collective Review)
Firmalar, ürün veya hizmetlerinin doğrudan "Kolektif Zekâ" radarına alınması ve geri bildirim toplanması için başvurur.
- **Çalışma Prensibi:** Bu paketi almış bir ürün/hizmet sonuçlarda çıkar, ancak **başlangıçta konsensüs skoru "%0" olarak gösterilir.**
- **Aktif Geri Bildirim:** Beiwe, bu ürünü daha önce araştırmış veya satın almış kullanıcılara uygun bir bağlamda memnuniyetlerini sorar (Örn: "Daha önce bu modeli araştırdığını hatırlıyorum, deneyimin nasıl oldu?").
- **Satın Alınamayan Güven:** Paketi satın almak sadece listelenmeyi ve soru sorulmasını sağlar. Yüksek konsensüs oranı parayla satın alınamaz; skor yalnızca gerçek insanlar olumlu görüş belirttikçe organik olarak artar.
- **Önemli Not:** Kolektif bilgi sadece bu hizmeti satın alan markalar için çalışmaz. İnternetteki her ürün, kavram ve hizmet için kolektif konsensüs organik olarak her halükarda hesaplanır. Bu paket, firmaların sadece Beiwe'nin "aktif soru sorma" gücünden faydalanmasını sağlar.

### 2. Doğrulanmış Ürün/Hizmet Paketi (Verified / Registered)
Firmalar, ürünlerine ait derinlemesine inceleme, teknik doküman, taahhütler ve resmi verileri Beiwe'ye sunar.
- **Çalışma Prensibi:** Beiwe bu verileri kendi standartlarında inceler ve doğrular. Sonrasında bu ürünler "Verified Knowledge" (Doğrulanmış Bilgi) katmanında onaylı rozetleriyle yer alır. Kullanıcı, açık web'deki yanlış veya manipülatif SEO içerikleriyle uğraşmadan, doğrudan markanın doğrulanmış net verisine ulaşır.

Bu model, "Netlik" (Clarity) felsefesini bozmaz, tam tersine markaları şeffaf olmaya ve gerçek kullanıcı deneyimiyle yüzleşmeye teşvik eder.

---

## Bölüm 12 — Beiwe Testi
*The Beiwe Test*

**Amaç: Son Süzgeç**

Beiwe bir netlik iddiasıdır. Herhangi bir özellik, ekran ya da satır kod gönderilmeden önce bu testten geçmek zorundadır.

> **Her özellik bu soruları cevaplamalıdır.**

- **Netliği artırıyor mu?**
- **Bağlamı koruyor mu?**
- **Kendini açıklıyor mu?**
- **Bilişsel yükü azaltıyor mu?**
- **Kullanıcının mülkiyetine saygı duyuyor mu?**
- **Geride yararlı bir hafıza bırakıyor mu?**
- **On yıl sonra da bunu inşa eder miydik?**
- **Saule bunu destekleyebilir mi?**
- **Düşünmeyi kesintiye uğratıyor mu?**
- **Steve Jobs bunu kaldırır mıydı?**

**Kural:** Cevaplardan biri bile "Hayır" ise, o özellik gönderilmez.

---

## 📚 Kitabın Son Hali

| Bölüm | Türkçe | English | Amaç |
|---|---|---|---|
| 1 | Beiwe Neden Var? | Why Beiwe Exists | Vizyon |
| 2 | Manifesto | Manifesto | Felsefe |
| 3 | Netlik Modeli | The Clarity Model | Ürün Mantığı |
| 4 | Browser İlkeleri | Browser Principles | Tarayıcı Davranışı |
| 5 | Ürün İlkeleri | Product Principles | Karar Mekanizması |
| 6 | Tasarım Dili | Design Language | Görsel Sistem |
| 7 | Etkileşim Dili | Interaction Language | Kullanıcı Akışı |
| 8 | Hareket Dili | Motion Language | Animasyon Sistemi |
| 9 | Saule Entegrasyonu | Saule Integration | SML + Beiwe İlişkisi |
| 10 | Teknik Mimari | Technical Architecture | Kod ve Sistem |
| 11 | İş Modeli ve Ticari Etik | Business Model & Ethics | Şeffaf Gelir Modeli |
| 12 | Beiwe Testi | The Beiwe Test | Son Süzgeç |

---

*© 2026 PEH Solutions — Beiwe Kitabı henüz erken tanımlama aşamasındadır. Ürün geliştirme süreci ilerledikçe güncellenecektir.*
