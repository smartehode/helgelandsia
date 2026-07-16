export const dynamic = 'force-dynamic'
export const metadata = { title: 'Logger inn …' }

export default function Innlogget() {
  return (
    <>
      <meta httpEquiv="refresh" content="0;url=/min-side" />
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-muted">Logger deg inn …</p>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){
  var dest=sessionStorage.getItem('authRedirect');
  if(dest&&dest.startsWith('/')&&!dest.startsWith('//')){
    sessionStorage.removeItem('authRedirect');
    window.location.replace(dest);
  }else{
    window.location.replace('/min-side');
  }
})();`
        }} />
      </div>
    </>
  )
}
