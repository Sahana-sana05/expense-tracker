const signupBtn=document.getElementById('signup-btn');
const loginBtn=document.getElementById('login-btn');
const authMessage=document.getElementById('auth-message');

function getAuthHeaders(){
  return {
    'Content-Type':'application/json',
    'Authorization':'Bearer ' + localStorage.getItem('token')
  };
}

signupBtn.addEventListener('click',function(){

  const email=document.getElementById('auth-email').value;
  const password=document.getElementById('auth-password').value;

  fetch("https://expense-tracker-backend-qwra.onrender.com/signup", {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:email,password:password})
  })
  .then(function(response){
    return response.json();
  })
  .then(function(data){
    authMessage.textContent='Signup successful! please login.';
  });
});

loginBtn.addEventListener('click',function(){
  const email=document.getElementById('auth-email').value;
  const password=document.getElementById('auth-password').value;

  fetch('https://expense-tracker-backend-qwra.onrender.com/login',{
    method:'POST',
    headers:{ 'Content-Type':'application/json'},
    body: JSON.stringify({email:email,password:password})
  })
  .then(function(response){
    return response.json();

  })
  .then(function(data){
    if(data.token){
      
      localStorage.setItem('token',data.token);
      document.getElementById('auth-section').style.display='none';
      document.getElementById('app-section').style.display='block';
      loadTransactions();
      loadBudgets();

    }else{
      authMessage.textContent=data.error;
    }   
  });
});

const logoutBtn=document.getElementById('logout-btn');

logoutBtn.addEventListener('click',function(){
  localStorage.removeItem('token');
  document.getElementById('app-section').style.display='none';
  document.getElementById('auth-section').style.display='block';
});

const form=document.getElementById('transaction-form');
let transactions=[];
let budgets=[];

form.addEventListener('submit',function(event){
    event.preventDefault();
    console.log('Submit fired!');


    const title=document.getElementById('title').value;
    const amount=document.getElementById('amount').value;
    const type=document.getElementById('type').value;
    const category=document.getElementById('category').value;

    const newTransaction={
        id: Date.now(),
        title: title,
        amount: amount,
        type: type,
        category:category

    };
    fetch('https://expense-tracker-backend-qwra.onrender.com/transactions',{
      method:'POST',
      headers:getAuthHeaders(),
      body:JSON.stringify(newTransaction)
    })
    .then(function(response){
      return response.json();
    })
    .then(function(data){
      transactions.push(data);
      renderTransactions(transactions);
      renderChart();
      renderBudgetStatus();
      form.reset();
      updateSummary();
    });
});
function renderTransactions(transactionsToShow){
    const list=document.getElementById('transaction-list');
    list.innerHTML='';
    transactionsToShow.forEach(function(transaction){
        const li =document.createElement('li');
        li.textContent=transaction.title + '-₹' + transaction.amount + '(' + transaction.type + ',' + transaction.category + ')';
        
        const deleteBtn=document.createElement('button');
        deleteBtn.textContent='Delete';

        deleteBtn.addEventListener('click',function(){
            deleteTransaction(transaction._id);    
        })
        
        li.appendChild(deleteBtn);
        list.appendChild(li);
    });
}
function deleteTransaction(id){
  fetch('https://expense-tracker-backend-qwra.onrender.com/transactions/'+id,{
    method: 'DELETE',
    headers:getAuthHeaders()
  })
  .then(function(response){
    return response.json();
  })
  .then(function(data){
    transactions=transactions.filter(function(transaction){
        return transaction._id !==id;
    })
    renderTransactions(transactions);
    renderChart();
    renderBudgetStatus();
    updateSummary();
  })
}
function updateSummary() {
  const income = transactions
    .filter(function(transaction) {
      return transaction.type === 'income';
    })
    .reduce(function(total, transaction) {
      return total + Number(transaction.amount);
    }, 0);

  const expense = transactions
    .filter(function(transaction) {
      return transaction.type === 'expense';
    })
    .reduce(function(total, transaction) {
      return total + Number(transaction.amount);
    }, 0);

  const balance = income - expense;

  document.getElementById('total-income').textContent = income;
  document.getElementById('total-expense').textContent = expense;
  document.getElementById('balance').textContent = balance;
}

function loadTransactions(){
  fetch('https://expense-tracker-backend-qwra.onrender.com/transactions',{
    headers:getAuthHeaders()
  })
  .then(function(response){
    if(response.status===401){
      logoutBtn.click();
      return Promise.reject('Session expired');
    }
    return response.json();
  })
  .then(function(data){
    transactions=data;
    renderTransactions(transactions);
    renderChart();
    updateSummary();
  })
  .catch(function(error){
    console.log(error);
  });
}

function applyFilter(){
  const selectedCategory=document.getElementById('filter-category').value;

  if (selectedCategory==='All'){
    renderTransactions(transactions);
  }else{
    const filtered=transactions.filter(function(transaction){
      return transaction.category===selectedCategory;
    });
    renderTransactions(filtered);
  }
}
document.getElementById('filter-category').addEventListener('change',applyFilter);

const budgetForm=document.getElementById('budget-form');

budgetForm.addEventListener('submit',function(event){
  event.preventDefault();


  const budgetCategory=document.getElementById('budget-category').value;
  const budgetLimit=document.getElementById('budget-limit').value;

  fetch('https://expense-tracker-backend-qwra.onrender.com/budgets',{
    method:'POST',
    headers:getAuthHeaders(),
    body:JSON.stringify({category:budgetCategory,limit:budgetLimit})
  })
  .then(function(response){
    return response.json();
  })
  .then(function(data){
    loadBudgets();
    budgetForm.reset();
  })
});

let expenseChart;
function renderChart(){
  const categoryTotals={};
  transactions.forEach(function(transaction){
    if(transaction.type==='expense'){
      if(categoryTotals[transaction.category]){
        categoryTotals[transaction.category]+=Number(transaction.amount);

      }else{
        categoryTotals[transaction.category]=Number(transaction.amount);
      }
    }
  });
  const labels=Object.keys(categoryTotals);
  const data=Object.values(categoryTotals);

  const ctx=document.getElementById('expenseChart');

  if(expenseChart){
    expenseChart.destroy();
  }
  expenseChart=new Chart(ctx,{
    type:'pie',
    data:{
      labels:labels,
      datasets:[{
        data:data,
        backgroundColor:['#6c63ff','#ff5c5c','#ffb84d','#4dd4ac','#4d9eff','#c084fc']
      }]
    }
  });
}

function loadBudgets(){
  fetch('https://expense-tracker-backend-qwra.onrender.com/budgets',{
    headers:getAuthHeaders()
  })
  .then(function(response){
    return response.json();
  })
  .then(function(data){
    budgets=data;
    renderBudgetStatus();
  })
};

function renderBudgetStatus(){
  const budgetDiv=document.getElementById('budget-status');
  budgetDiv.innerHTML='';

  budgets.forEach(function(budget){
    const spent=transactions
    .filter(function(transaction){
      return transaction.category===budget.category&&transaction.type==='expense';
    })
    .reduce(function(total,transaction){
      return total+Number(transaction.amount);

    },0);
    const statusLine=document.createElement('p');
    statusLine.textContent=budget.category+ ': ₹' + spent + ' / ₹' + budget.limit;

    if(spent>budget.limit){
      statusLine.style.color='red';
    }

    const progressContainer=document.createElement('div');
    progressContainer.style.background='#eee';
    progressContainer.style.borderRadius='5px';
    progressContainer.style.height='10px';
    progressContainer.style.marginBottom='10px';

    const progressBar=document.createElement('div');
    const percentage=Math.min((spent/budget.limit)*100,100);
    progressBar.style.width=percentage+'%';
    progressBar.style.height='100%';
    progressBar.style.borderRadius='5px';
    progressBar.style.backgroundColor=spent>budget.limit ? '#ff5c5c' : '#6c63ff';

    progressContainer.appendChild(progressBar);

    budgetDiv.appendChild(statusLine);
    budgetDiv.appendChild(progressContainer);
  })
}

const savedToken=localStorage.getItem('token');
if(savedToken){
  document.getElementById('auth-section').style.display='none';
  document.getElementById('app-section').style.display='block';
  loadTransactions();
  loadBudgets();
}

/* =========================================
   THEME TOGGLE
========================================= */

const themeToggle = document.getElementById('theme-toggle');

const savedTheme = localStorage.getItem('expenseTrackerTheme');

if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');

    if (themeToggle) {
        themeToggle.textContent = '☀️';
    }
}

if (themeToggle) {

    themeToggle.addEventListener('click', function () {

        document.body.classList.toggle('dark-theme');

        const isDark =
            document.body.classList.contains('dark-theme');

        localStorage.setItem(
            'expenseTrackerTheme',
            isDark ? 'dark' : 'light'
        );

        themeToggle.textContent =
            isDark ? '☀️' : '🌙';

    });

}

