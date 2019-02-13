import _ from 'lodash';
import './style.css';
import '../res/img/example.jpg'

    function component() {
        let element = document.createElement('div');
        element.innerHTML = _.join(['Hello', 'webpack'], ' ');
        element.classList.add('hello');
        return element;
    }

document.body.appendChild(component());