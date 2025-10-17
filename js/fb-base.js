jQuery(document).ready(function($) {

    const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    async function createData() {
        let event_time_start = new Date().getTime();
        let day_of_week = new Date().getDay();
        let month = new Date().getMonth();
        let hour_start = new Date().getHours();
    
        let data = {
            fb_js: fbData.fb_js,
            fb_pixel_id: fbData.fb_pixel_id,
            url_ajax: fbData.url_ajax,
            event_name: fbData.event_name,
            event_id: fbData.event_id,
            user_data: fbData.user_data,
            custom_data: fbData.custom_data,
            page_title: document.title,
            traffic_source: document.referrer,
            utm_source: await searchParamsCookiesAndUrl('utm_source'),
            utm_medium: await searchParamsCookiesAndUrl('utm_medium'),
            utm_campaign: await searchParamsCookiesAndUrl('utm_campaign'),
            utm_id: await searchParamsCookiesAndUrl('utm_id'),
            utm_term: await searchParamsCookiesAndUrl('utm_term'),
            utm_content: await searchParamsCookiesAndUrl('utm_content'),
            src: await searchParamsCookiesAndUrl('src'),
            sck: await searchParamsCookiesAndUrl('sck'),
            day_of_week: day_of_week,
            month: month,
            hour_start: hour_start,
            event_day_in_month: new Date().getDate(),
            event_day: WEEK_DAYS[day_of_week],
            event_month: MONTHS[month],
            event_time_interval: `${hour_start}-${hour_start + 1}`,
            event_time_start: event_time_start,
            user_agent: navigator.userAgent,
            fb_fbc: await searchParamsCookiesAndUrl('_fbc', 'fbclid'),
            fb_fbp: await searchParamsCookiesAndUrl('_fbp', 'fbp') 
        };
    
        // Ajuste do valor de fb_fbc
        if (data.fb_fbc && !data.fb_fbc.startsWith('fb.')) {
            // Se não tem formato válido, não envia
            data.fb_fbc = '';
        }
    
        facebookLoadPixel(data);
        trackFbqPageView(data);
    }
    
    async function facebookLoadPixel(data) {
        if (typeof fbq === 'undefined') {
            ! function(f, b, e, v, n, t, s) {
                if (f.fbq) return;
                n = f.fbq = function() {
                    n.callMethod ?
                        n.callMethod.apply(n, arguments) : n.queue.push(arguments)
                };
                if (!f._fbq) f._fbq = n;
                n.push = n;
                n.loaded = !0;
                // n.version = '2.0';
                n.queue = [];
                t = b.createElement(e);
                t.async = !0;
                t.src = v;
                s = b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t, s)
            }(window, document, 'script', data.fb_js);

            let pixel = data.fb_pixel_id;

            if (typeof pixel !== 'undefined') {
                fbq('init', pixel);
            }
        }
    }

    async function trackFbqPageView(data) {
        if (typeof fbq === 'undefined') {
            console.log("FBQ não carregado");
            return;
        }

        let event_name = data.event_name || "PageView";
		let event_id = data.event_id;

        data.user_data.fbc = data.fb_fbc;
        data.user_data.fbp = data.fb_fbp;

        let params = {
            event_name: event_name,
            event_time: Math.floor(Date.now() / 1000),
            event_id: event_id,
            event_source_url: window.location.href,
            action_source: 'website',
            user_data: data.user_data,
            custom_data: data.custom_data,
		};

        let paramsPixel = {
            ...params,
            ...params.user_data,
            ...params.custom_data
        };

        delete paramsPixel.user_data;
        delete paramsPixel.custom_data;

        if (data.fb_pixel_id) {
            fbq('track', event_name, paramsPixel, {eventID: event_id});

            fetch(fbData.url_ajax, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: 'send_pageview',
                    event_id: event_id,
                    params: JSON.stringify(params),
                })
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('Erro 400:', text);
                    });
                }
                return response.json();
            })
            .then(json => {
                if (json) console.log('Sucesso:', json);
            })
            .catch(err => console.error('Erro geral:', err));
        }
    }

    async function searchParamsCookiesAndUrl(...params) {
        const urlSearchParams = new URLSearchParams(window.location.search);
    
        for (const param of params) {
            if (urlSearchParams.has(param)) {
                return urlSearchParams.get(param);
            }
        }
    
        for (const param of params) {
            const cookieName = param;
            const cookieValue = await getCookie(cookieName);
            if (cookieValue) {
                return cookieValue;
            }
        }
    
        return '';
    }

    async function getCookie(key) {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [cookieKey, cookieValue] = cookie.trim().split('=');
            if (cookieKey === key) {
                return cookieValue;
            }
        }

        const localStorageValue = localStorage.getItem(key);
        return localStorageValue;
    }

    createData();
})
