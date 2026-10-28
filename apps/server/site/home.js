(function(){
 const {$,h}=A;
 A.markMyOs();
 A.version.then(v=>{A.fillSizes(v);$('ver').textContent='Miễn phí · bản '+v.version+' · beta';}).catch(()=>{});
 fetch('api/health',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(()=>{$('dot').classList.add('online');$('srv').textContent='Máy chủ đang mở';}).catch(()=>{$('srv').textContent='Tạm thời chưa kết nối được máy chủ';});
 fetch('api/news?limit=3',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(list=>{
  $('news').replaceChildren(...list.slice(0,3).map(n=>h('a.portal-news-card',{href:'tin-tuc#tin-'+n.id},h('div.flex.items-center.justify-between.gap-2',null,h('span.portal-chip',null,n.tag),h('small',null,n.date)),h('h3',null,n.title),h('p.line-clamp-3',null,n.body.join(' · ')))));
  if(!list.length)$('news').append(h('p.portal-section-desc',null,'Tin từ Aether sẽ được đăng tại đây.'));
 }).catch(()=>$('news').replaceChildren(h('p.portal-section-desc',null,'Chưa tải được bản tin. ',h('a.portal-link',{href:'tin-tuc'},'Mở trang tin tức'))));
 fetch('api/posts?limit=4',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(list=>{
  $('posts').replaceChildren(...list.map(p=>h('a.portal-post',{href:'bai-viet?id='+p.id},h('strong',null,p.title),h('small',null,p.author+' · '+A.ago(p.at)+' · '+p.comments+' bình luận'))));
  if(!list.length)$('posts').append(h('p.portal-section-desc',null,'Quán trọ còn vắng. ',h('a.portal-link',{href:'dien-dan#viet'},'Viết câu chuyện đầu tiên')));
 }).catch(()=>$('posts').replaceChildren(h('a.portal-link',{href:'dien-dan'},'Mở diễn đàn cộng đồng →')));
 A.lightbox(document.querySelectorAll('#gallery figure'));
})();
