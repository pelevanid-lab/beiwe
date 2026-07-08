# Beiwe Blueprint: The Clarity Engine Architecture

## Vizyon
Beiwe, sıradan bir CRM (Müşteri İlişkileri Yönetimi) aracı olmanın ötesinde, **çok katmanlı (multi-layered)** ve **bağlam farkındalığı yüksek (context-aware)** bir asistan platformudur. Şirketlerin müşteri yönetimi (CRM), randevu ve takvim organizasyonu, doküman yönetimi ve görev takibi gibi operasyonlarını tek bir merkezden yürütmesini sağlar.

## Çok Katmanlı Yapı ve Karşılaşılan Zorluklar
Beiwe gibi çok katmanlı araçlarda en büyük risk, kullanıcının farklı modüller, menüler ve ekranlar arasında kaybolmasıdır. Geleneksel sistemler statik menüler ve karmaşık yönlendirmelerle çalışırken, Beiwe bu sorunu **Clarity Engine (Netlik Motoru)** adını verdiğimiz dinamik bir yapay zeka yönlendirme katmanıyla çözer.

## Clarity Engine (Netlik Motoru) Nedir?
Clarity Engine, Beiwe'nin kalbidir. Kullanıcının girdiği her bir metni, sorguyu ve komutu analiz eder. Yalnızca bir chatbot gibi cevap vermekle kalmaz, aynı zamanda kullanıcının **sistem üzerindeki niyetini** (intent) sezer ve arka plandaki arayüzü bu niyete göre anında şekillendirir.

### Clarity Engine'in Temel Görevleri:
1. **Bağlamı (Context) Sentezlemek:** Kullanıcının geçmiş verilerini, notlarını ve takvimini saniyeler içinde tarayarak sorguyla ilişkilendirir.
2. **Sistem Farkındalığı (System Awareness):** Kullanıcı bir müşteriden veya randevudan bahsettiğinde, arayüz otomatik olarak ilgili modüle veya müşterinin detay sayfasına yönlenir. Arayüz pasif bir tuval değil, kullanıcının eylemlerine ayak uyduran aktif bir çalışma alanıdır.
3. **Akıllı Yönlendirme ve Sekme Yönetimi:**
   - Bir soru sorulduğunda, Clarity Engine ilgili verileri ve eylem kartlarını anında sunar.
   - Eğer konuşma spesifik bir müşteri veya eylem etrafında şekilleniyorsa, söz konusu modül (örneğin Randevular veya Müşteri Detay sayfası) hemen bir **Sekme (Tab)** olarak kullanıcının görüş alanına açılır. 
   - Böylece kullanıcı menüler arasında gezinmek zorunda kalmaz; arama/komut çubuğu (search bar) **ana yönlendirici (menu selector)** işlevi görür.

## Hedef: Kaybolmamak
Biz şu an CRM katmanını inşa ediyoruz. Ancak ileride eklenecek olan Finans, İK, Proje Yönetimi gibi katmanlarda da aynı felsefe korunacaktır. Kullanıcı ne kadar derine inerse insin, ana komut satırı ve Clarity Engine sayesinde her zaman ne yaptığının farkında olacak, sistem onun hızına ve düşünce akışına otomatik olarak adapte olacaktır.
